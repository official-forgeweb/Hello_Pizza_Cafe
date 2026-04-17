import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Fetch the order first
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { addOns: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order is not in PENDING status" },
        { status: 400 }
      );
    }

    // Step 1: Upsert customer by phone
    // Done first — if this fails, order stays PENDING (safe)
    let customer;
    try {
      // Try to find existing customer
      customer = await prisma.customer.findFirst({
        where: { phone: order.customerPhone },
      });

      if (customer) {
        // Update existing customer with latest info
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: order.customerName,
            ...(order.customerEmail && { email: order.customerEmail }),
          },
        });
      } else {
        // Create new customer
        customer = await prisma.customer.create({
          data: {
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail || null,
          },
        });
      }
    } catch (customerErr) {
      console.error("Customer upsert failed:", customerErr);
      return NextResponse.json(
        { error: "Failed to save customer data. Order was NOT accepted." },
        { status: 500 }
      );
    }

    // Step 2: Update order status to CONFIRMED and link customer
    // Only runs if Step 1 succeeded
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        customerId: customer.id,
      },
      include: {
        items: { include: { addOns: true } },
      },
    });

    // Send status email asynchronously (non-blocking)
    try {
      const { sendOrderStatusEmail } = await import("@/lib/email");
      sendOrderStatusEmail(updatedOrder).catch((err) => {
        console.error("Order status email failed:", err);
      });
    } catch {
      // Email module may fail, don't block the response
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      customer,
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    return NextResponse.json(
      { error: "Failed to accept order" },
      { status: 500 }
    );
  }
}
