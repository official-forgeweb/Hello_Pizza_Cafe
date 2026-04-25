import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, message } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Map POS status to Website OrderStatus
    let newStatus = "PENDING";
    const posStatus = status.toLowerCase();
    
    if (posStatus === "accepted") newStatus = "CONFIRMED";
    else if (posStatus === "preparing") newStatus = "PREPARING";
    else if (posStatus === "ready") newStatus = "READY";
    else if (posStatus === "out_for_delivery") newStatus = "OUT_FOR_DELIVERY";
    else if (posStatus === "delivered" || posStatus === "completed") newStatus = "DELIVERED";
    else if (posStatus === "rejected" || posStatus === "cancelled") newStatus = "CANCELLED";

    // Update the order
    await prisma.order.update({
      where: { id: order_id },
      data: {
        status: newStatus as any,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Order ${order_id} status updated to ${newStatus}`
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
