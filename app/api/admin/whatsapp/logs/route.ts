import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderNotificationService } from "@/lib/services/orderNotificationService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: "insensitive" } },
        { templateUsed: { contains: search, mode: "insensitive" } },
        { messageType: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        { order: { customerName: { contains: search, mode: "insensitive" } } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              cancellationReason: true,
              assignedStaff: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.messageLog.count({ where }),
    ]);

    const serializedLogs = logs.map((log) => {
      if (log.customer) {
        return {
          ...log,
          customer: {
            ...log.customer,
            id: log.customer.phone,
          },
        };
      }
      return log;
    });

    return NextResponse.json({
      logs: serializedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching message logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch message logs" },
      { status: 500 }
    );
  }
}

// POST - Retry a failed message
export async function POST(request: NextRequest) {
  try {
    const { logId } = await request.json();
    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const log = await prisma.messageLog.findUnique({
      where: { id: logId },
      include: {
        order: {
          include: {
            assignedStaff: true,
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Message log not found" }, { status: 404 });
    }

    if (!log.orderId) {
      return NextResponse.json(
        { error: "This log is not associated with an order and cannot be automatically retried." },
        { status: 400 }
      );
    }

    const orderId = log.orderId;
    const type = log.templateUsed || log.messageType;

    // Reset the corresponding WhatsApp flag on the order table to allow resending
    if (type === "pos_order_receipt" || type === "order_confirmation2") {
      await prisma.order.update({
        where: { id: orderId },
        data: { waConfirmationSent: false },
      });
    } else if (type.startsWith("order_preparing")) {
      await prisma.order.update({
        where: { id: orderId },
        data: { waPreparingSent: false },
      });
    } else if (type === "order_out_for_delivery") {
      await prisma.order.update({
        where: { id: orderId },
        data: { waOutForDeliverySent: false },
      });
    } else if (type === "order_delivered") {
      await prisma.order.update({
        where: { id: orderId },
        data: { waDeliveredSent: false },
      });
    }

    let result: any = { success: false, error: "Unsupported message type" };

    // Trigger the notification service
    if (type === "pos_order_receipt") {
      result = await OrderNotificationService.sendPOSReceipt(orderId);
    } else if (type === "order_confirmation2") {
      result = await OrderNotificationService.sendOrderConfirmation(orderId);
    } else if (type.startsWith("order_preparing")) {
      result = await OrderNotificationService.sendOrderPreparing(orderId);
    } else if (type === "order_out_for_delivery") {
      const deliveryBoy = {
        name: log.order?.assignedStaff?.name || "Delivery Boy",
        phone: log.order?.assignedStaff?.phone || "0000000000",
      };
      result = await OrderNotificationService.sendOrderOutForDelivery(orderId, deliveryBoy);
    } else if (type === "order_delivered") {
      result = await OrderNotificationService.sendOrderDelivered(orderId);
    } else if (type.startsWith("order_cancelled")) {
      const reason = log.order?.cancellationReason || "Order cancelled";
      result = await OrderNotificationService.sendOrderCancelled(orderId, reason);
    }

    if (result.success) {
      // Update original failed log to 'retried' or create a new status record
      await prisma.messageLog.update({
        where: { id: logId },
        data: { status: "sent", errorMessage: null },
      });
      return NextResponse.json({ success: true, message: "Message resent successfully!" });
    } else {
      // Update the log with the new error message
      await prisma.messageLog.update({
        where: { id: logId },
        data: { status: "failed", errorMessage: result.error || "Retry failed again" },
      });
      return NextResponse.json(
        { error: result.error || "Meta rejected the resend request." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error retrying message:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during retry." },
      { status: 500 }
    );
  }
}

// PUT - Update customer phone number on order and customer record
export async function PUT(request: NextRequest) {
  try {
    const { orderId, customerId, phone } = await request.json();
    if (!orderId || !phone) {
      return NextResponse.json({ error: "orderId and phone are required" }, { status: 400 });
    }

    // Sanitize and check length
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number length" }, { status: 400 });
    }

    // Update Order Phone
    await prisma.order.update({
      where: { id: orderId },
      data: { customerPhone: cleanPhone },
    });

    // Update Customer Phone if customerId exists
    if (customerId) {
      try {
        await prisma.customer.update({
          where: { phone: customerId },
          data: { phone: cleanPhone },
        });
      } catch (custErr) {
        console.warn("Could not update phone in Customer record (may already exist):", custErr);
      }
    }

    return NextResponse.json({ success: true, message: "Phone number updated in database." });
  } catch (error: any) {
    console.error("Error updating phone number:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update phone number" },
      { status: 500 }
    );
  }
}
