import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch orders that haven't been synced to the POS yet
    const orders = await prisma.order.findMany({
      where: { 
        isSynced: false,
        status: "PENDING"
      },
      orderBy: { placedAt: "asc" },
      include: {
        items: {
          include: { addOns: true },
        },
      },
    });

    // Format orders precisely how the FlashBill POS expects them
    const formattedOrders = orders.map(order => ({
      order_id: order.id,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || ""
      },
      order_type: order.orderType.toLowerCase(),
      delivery_address: order.deliveryAddress ? { address: order.deliveryAddress, instructions: order.deliveryInstructions || "" } : {},
      items: order.items.map(item => ({
        menu_item_id: item.menuItemId,
        item_name: item.itemName,
        quantity: item.quantity,
        line_total: Number(item.itemTotal) || (Number(item.basePrice) * item.quantity),
        price: Number(item.basePrice),
        variant: item.variantName ? {
          name: item.variantName,
          price: Number(item.variantPrice || 0)
        } : null,
        modifiers: item.addOns.map(addon => ({
          name: addon.addonName,
          price: Number(addon.addonPrice),
          qty: addon.quantity
        }))
      })),
      coupon: {
        code: order.couponCode || "",
        discount_amount: Number(order.discountAmount)
      },
      bill_summary: {
        subtotal: Number(order.subtotal),
        delivery_charge: Number(order.deliveryFee),
        packaging_charge: 0,
        cgst: Number(order.taxAmount) / 2, // Split tax evenly if needed
        sgst: Number(order.taxAmount) / 2,
        grand_total: Number(order.totalAmount)
      },
      payment: {
        mode: "cod", // Future: dynamically fetch payment method
        status: "pending",
        transaction_id: ""
      },
      customer_note: order.orderNotes || "",
      order_time: order.placedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });
  } catch (error: any) {
    console.error("Error fetching pending orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending orders" },
      { status: 500 }
    );
  }
}
