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
      }
    });

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
