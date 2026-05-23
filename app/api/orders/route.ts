import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  calculateDistanceKm,
  calculateDeliveryFee,
  getDefaultDeliveryConfig,
  getDefaultDeliveryZones,
  DeliveryConfig,
  DeliveryZone,
} from "@/lib/delivery";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      orderType = "DELIVERY",
      deliveryAddress,
      deliveryInstructions,
      couponCode,
      orderNotes,
      items,
      whatsappOptIn = false,
      deliveryLat,
      deliveryLng,
    } = body;

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify all menu items exist to prevent Foreign Key failures
    const validMenuItems = new Set<string>();
    const menuItemIds = items.map((i: any) => i.menuItemId).filter(Boolean);
    if (menuItemIds.length > 0) {
      const existingItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } },
        select: { id: true }
      });
      existingItems.forEach(i => validMenuItems.add(i.id));
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map(
      (item: {
        menuItemId: string;
        itemName: string;
        itemType?: string;
        variantName?: string;
        basePrice: number;
        variantPrice: number;
        addonsPrice: number;
        quantity: number;
        specialInstructions?: string;
        addOns?: { addonName: string; addonPrice: number; quantity: number }[];
      }) => {
        const unitPrice = item.variantPrice > 0 ? item.variantPrice : item.basePrice;
        const itemTotal = (unitPrice + item.addonsPrice) * item.quantity;
        subtotal += itemTotal;
        return {
          menuItemId: item.menuItemId && validMenuItems.has(item.menuItemId) ? item.menuItemId : null,
          itemName: item.itemName,
          itemType: item.itemType,
          variantName: item.variantName,
          basePrice: item.basePrice,
          variantPrice: item.variantPrice || 0,
          addonsPrice: item.addonsPrice || 0,
          quantity: item.quantity,
          itemTotal,
          specialInstructions: item.specialInstructions,
          addOns: {
            create:
              item.addOns?.map(
                (addon: { addonName: string; addonPrice: number; quantity: number }) => ({
                  addonName: addon.addonName,
                  addonPrice: addon.addonPrice,
                  quantity: addon.quantity || 1,
                })
              ) || [],
          },
        };
      }
    );

    // Tax and delivery fee
    const taxRate = 0.05;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

    let deliveryFee = 0;
    if (orderType === "DELIVERY") {
      const [configRow, zonesRow] = await Promise.all([
        prisma.restaurantSetting.findUnique({ where: { key: "delivery_config" } }),
        prisma.restaurantSetting.findUnique({ where: { key: "delivery_zones" } }),
      ]);

      const config: DeliveryConfig = configRow
        ? (configRow.value as unknown as DeliveryConfig)
        : getDefaultDeliveryConfig();

      const zones: DeliveryZone[] = zonesRow
        ? (zonesRow.value as unknown as DeliveryZone[])
        : getDefaultDeliveryZones();

      if (typeof deliveryLat === "number" && typeof deliveryLng === "number") {
        const distanceKm = calculateDistanceKm(
          config.cafeLocation.lat,
          config.cafeLocation.lng,
          deliveryLat,
          deliveryLng
        );
        const result = calculateDeliveryFee(distanceKm, subtotal, zones, config);
        if (!result.isDeliverable) {
          return NextResponse.json(
            { error: result.message },
            { status: 400 }
          );
        }
        deliveryFee = result.deliveryFee;
      } else {
        deliveryFee = config.fallbackDeliveryFee;
      }
    }

    // Coupon discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (
        coupon &&
        coupon.isActive &&
        subtotal >= Number(coupon.minimumOrder)
      ) {
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = Math.round(
            subtotal * (Number(coupon.discountValue) / 100)
          );
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
          }
        } else {
          discountAmount = Number(coupon.discountValue);
        }
        // Increment usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const totalAmount = subtotal + taxAmount + deliveryFee - discountAmount;

    // Generate order number in YYMMDD501 format with collision handling
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const prefix = `${yy}${mm}${dd}`;
    const minOrderNumber = `${prefix}500`;
    
    let orderNumber = "";
    let attempts = 0;
    while (attempts < 10) {
      const ordersToday = await prisma.order.count({
        where: {
          orderNumber: {
            gt: minOrderNumber,
            startsWith: prefix,
          },
        },
      });
      const seq = String(500 + ordersToday + 1 + attempts).padStart(3, "0");
      orderNumber = `${prefix}${seq}`;
      
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) {
        break;
      }
      attempts++;
    }


    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          whatsappOptIn,
          totalOrders: 1,
          totalSpent: totalAmount,
          lastOrderDate: new Date(),
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          whatsappOptIn: whatsappOptIn ? true : customer.whatsappOptIn, // Don't opt out if already opted in, only opt in
          totalOrders: { increment: 1 },
          totalSpent: { increment: totalAmount },
          lastOrderDate: new Date(),
        }
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail,
        orderType,
        deliveryAddress,
        deliveryInstructions,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        totalAmount,
        couponCode,
        orderNotes,
        estimatedPrepTime: 20,
        estimatedDeliveryTime: orderType === "PICKUP" ? 20 : orderType === "DINE_IN" ? 0 : 40,
        deliveryLat: typeof deliveryLat === "number" ? deliveryLat : null,
        deliveryLng: typeof deliveryLng === "number" ? deliveryLng : null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: { addOns: true },
        },
      },
    });

    // Increment totalOrders on menu items
    for (const item of items) {
      if (item.menuItemId) {
        try {
          // Verify it exists first to avoid crashing if frontend uses mock menu items
          const exists = await prisma.menuItem.findUnique({
             where: { id: item.menuItemId }
          });
          if (exists) {
            await prisma.menuItem.update({
              where: { id: item.menuItemId },
              data: { totalOrders: { increment: item.quantity } },
            });
          }
        } catch (updateErr) {
          console.warn("Could not increment menuItem stats:", updateErr);
        }
      }
    }

    // Send confirmation emails asynchronously
    const { sendOrderConfirmationEmail, sendAdminOrderNotification } = await import("@/lib/email");
    
    // Customer email
    sendOrderConfirmationEmail(order).catch(err => {
      console.error("Order confirmation email failed:", err);
    });

    // Admin notification
    sendAdminOrderNotification(order).catch(err => {
      console.error("Admin order notification failed:", err);
    });

    // WhatsApp Order Confirmation
    const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
    OrderNotificationService.sendOrderConfirmation(order.id).catch(err => {
      console.error("WhatsApp confirmation failed:", err);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      include: {
        items: {
          include: { addOns: true },
        },
        assignedStaff: {
          select: { name: true, role: true }
        }
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
