import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, action, message, reason } = body;

    if (!order_id || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Map POS action to Website OrderStatus
    let newStatus = "CONFIRMED";
    if (action === "rejected") {
      newStatus = "CANCELLED";
    }

    // Update the order
    const order = await prisma.order.update({
      where: { id: order_id },
      data: {
        isSynced: true,
        syncedAt: new Date(),
        status: newStatus as any,
        cancellationReason: reason || null,
      },
      include: {
        items: true,
        customer: true,
      }
    });

    // Trigger notifications asynchronously so we don't block the POS sync response
    if (newStatus === "CONFIRMED") {
      // WhatsApp confirmation is intentionally skipped here so it can be sent 
      // when the cashier actually saves and syncs the order from the POS.

      // 2. Email confirmation
      if (order.customerEmail) {
        import("@/lib/email").then(({ sendOrderConfirmationEmail }) => {
          sendOrderConfirmationEmail(order).catch(err => {
            console.error("Order confirmation email failed:", err);
          });
        }).catch(err => {
          console.error("Failed to load email service:", err);
        });
      }
    } else if (newStatus === "CANCELLED") {
      // 1. WhatsApp cancellation
      if (order.customerPhone && order.customerPhone !== "0000000000") {
        import("@/lib/services/orderNotificationService").then(({ OrderNotificationService }) => {
          OrderNotificationService.sendOrderCancelled(order.id, reason || "Restaurant was unable to accept your order").catch(err => {
            console.error("WhatsApp order cancellation failed:", err);
          });
        }).catch(err => {
          console.error("Failed to load OrderNotificationService:", err);
        });
      }

      // 2. Email cancellation
      if (order.customerEmail) {
        import("@/lib/email").then(({ sendOrderStatusEmail }) => {
          sendOrderStatusEmail(order).catch(err => {
            console.error("Order cancellation email failed:", err);
          });
        }).catch(err => {
          console.error("Failed to load email service:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order ${order_id} acknowledged as ${action}`
    });
  } catch (error: any) {
    console.error("Error acknowledging order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to acknowledge order" },
      { status: 500 }
    );
  }
}
