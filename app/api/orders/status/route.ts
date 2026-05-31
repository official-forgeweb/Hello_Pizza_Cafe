import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "Missing orderNumber" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        status: true,
        cancellationReason: true,
        customerName: true,
        orderType: true,
        deliveryAddress: true,
        deliveryFee: true,
        taxAmount: true,
        subtotal: true,
        totalAmount: true,
        items: {
          include: {
            addOns: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Error fetching order status:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order status" }, { status: 500 });
  }
}
