import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderNotificationService } from "@/lib/services/orderNotificationService";

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
      include: { assignedStaff: true }
    });

    if (body.status !== undefined) {
      const { sendOrderStatusEmail } = await import("@/lib/email");
      sendOrderStatusEmail(order).catch(err => {
        console.error("Order status email failed:", err);
      });
      
      const { OrderNotificationService } = await import("@/lib/services/orderNotificationService");
      
      if (body.status === "PREPARING") {
        OrderNotificationService.sendOrderPreparing(order.id).catch(console.error);
      } else if (body.status === "OUT_FOR_DELIVERY") {
        // Assuming we have some delivery boy info in the body or order
        const deliveryBoy = { 
          name: body.deliveryBoyName || order.assignedStaff?.name || "Our Driver", 
          phone: body.deliveryBoyPhone || order.assignedStaff?.phone || "" 
        };
        OrderNotificationService.sendOrderOutForDelivery(order.id, deliveryBoy).catch(console.error);
      } else if (body.status === "DELIVERED") {
        OrderNotificationService.sendOrderDelivered(order.id).catch(console.error);
      } else if (body.status === "CANCELLED") {
        const reason = body.cancellationReason || order.cancellationReason || "Unknown reason";
        OrderNotificationService.sendOrderCancelled(order.id, reason).catch(console.error);
      }
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
