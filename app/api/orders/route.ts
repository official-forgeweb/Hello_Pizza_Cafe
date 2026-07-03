/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedDeliveryConfig, getCachedDeliveryZones } from "@/lib/settings";
import {
  calculateDistanceKm,
  calculateDeliveryFee,
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
      whatsappOptIn = true,
      deliveryLat,
      deliveryLng,
      loyaltyPointsRedeemed = 0,
    } = body;

    let finalPhone = customerPhone?.trim() || "";
    let finalName = customerName?.trim() || "";

    if (orderType === "DINE_IN") {
      if (!finalPhone) {
        finalPhone = "0000000000";
      }
      if (!finalName) {
        finalName = "Dine-in Guest";
      }
    } else {
      if (!finalPhone) {
        return NextResponse.json(
          { error: "Phone number is required for pickup and delivery" },
          { status: 400 }
        );
      }
      if (!finalName) {
        finalName = "Guest";
      }
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required items" },
        { status: 400 }
      );
    }

    const finalWhatsappOptIn = finalPhone === "0000000000" ? false : whatsappOptIn;

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
      const [config, zones] = await Promise.all([
        getCachedDeliveryConfig(),
        getCachedDeliveryZones(),
      ]);

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

    // Validate and deduct loyalty points
    let pointsToRedeem = Number(loyaltyPointsRedeemed || 0);
    const { CustomerService } = await import("@/lib/services/customerService");
    if (pointsToRedeem > 0 && finalPhone && finalPhone !== "0000000000") {
      const wallet = await CustomerService.getCustomerLoyaltyWallet(finalPhone);
      if (pointsToRedeem > wallet.availablePoints) {
        return NextResponse.json(
          { error: `Insufficient loyalty points. Available: ${wallet.availablePoints}` },
          { status: 400 }
        );
      }
      if (pointsToRedeem > totalAmount) {
        pointsToRedeem = Math.floor(totalAmount);
      }
    } else {
      pointsToRedeem = 0;
    }

    const finalTotalAmount = Math.max(0, totalAmount - pointsToRedeem);

    // Calculate loyalty points earned on final amount (excluding redeemed points) on a percentage basis, rounded
    const globalSettings = await prisma.globalSetting.findUnique({
      where: { id: 1 }
    });
    const pointsPerAmount = globalSettings ? Number(globalSettings.loyaltyPointsPerAmount) : 5;
    const amountThreshold = globalSettings ? Number(globalSettings.loyaltyAmountThreshold) : 100;
    const expiryDays = globalSettings ? Number(globalSettings.loyaltyMaxDays) : 30;

    const pointsEarned = Math.round(Number(finalTotalAmount) * (pointsPerAmount / amountThreshold));

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
      where: { phone: finalPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: finalName,
          phone: finalPhone,
          email: customerEmail,
          whatsappOptIn: finalWhatsappOptIn,
          totalOrders: 0,
          totalSpent: 0,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { phone: customer.phone },
        data: {
          whatsappOptIn: finalWhatsappOptIn ? true : customer.whatsappOptIn, // Don't opt out if already opted in, only opt in
        }
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.phone,
        customerName: finalName,
        customerPhone: finalPhone,
        customerEmail,
        orderType,
        deliveryAddress,
        deliveryInstructions,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        totalAmount: finalTotalAmount,
        couponCode,
        orderNotes,
        estimatedPrepTime: 20,
        estimatedDeliveryTime: orderType === "PICKUP" ? 20 : orderType === "DINE_IN" ? 0 : 40,
        deliveryLat: typeof deliveryLat === "number" ? deliveryLat : null,
        deliveryLng: typeof deliveryLng === "number" ? deliveryLng : null,
        loyaltyPointsEarned: pointsEarned,
        loyaltyPointsRedeemed: pointsToRedeem,
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

    // Create loyalty transaction logs
    if (finalPhone && finalPhone !== "0000000000") {
      const timestamp = new Date();
      
      if (pointsToRedeem > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            phoneNumber: finalPhone,
            orderId: order.id,
            type: "REDEEM",
            points: -pointsToRedeem,
            timestamp,
            expiryDate: timestamp,
            isPending: false
          }
        });
      }

      if (pointsEarned > 0) {
        const expiryDate = new Date(timestamp.getTime() + expiryDays * 24 * 60 * 60 * 1000);
        await prisma.loyaltyTransaction.create({
          data: {
            phoneNumber: finalPhone,
            orderId: order.id,
            type: "EARN",
            points: pointsEarned,
            timestamp,
            expiryDate,
            isPending: true
          }
        });
      }
    }

    // Recalculate customer stats dynamically from order history
    await CustomerService.recalculateCustomerStats(customer.phone);

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

    // Send admin notification email asynchronously
    const { sendAdminOrderNotification } = await import("@/lib/email");
    
    // Admin notification
    sendAdminOrderNotification(order).catch(err => {
      console.error("Admin order notification failed:", err);
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

export async function GET(_request: NextRequest) {
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
