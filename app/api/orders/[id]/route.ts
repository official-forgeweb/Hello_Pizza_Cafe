import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // We might be updating status OR assigning staff
    const updateData: any = {};
    
    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // Update timestamp based on status
      if (body.status === "CONFIRMED") updateData.confirmedAt = new Date();
      if (body.status === "PREPARING") updateData.preparedAt = new Date();
      if (body.status === "DELIVERED") updateData.deliveredAt = new Date();
      if (body.status === "CANCELLED") updateData.cancelledAt = new Date();
    }
    
    if (body.assignedStaffId !== undefined) {
      updateData.assignedStaffId = body.assignedStaffId;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (body.status !== undefined) {
      const { sendOrderStatusEmail } = await import("@/lib/email");
      sendOrderStatusEmail(order).catch(err => {
        console.error("Order status email failed:", err);
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
