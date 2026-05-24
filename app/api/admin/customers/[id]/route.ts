import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { whatsappOptIn, group } = body;

    const updateData: any = {};
    if (typeof whatsappOptIn === "boolean") {
      updateData.whatsappOptIn = whatsappOptIn;
    }
    if (group) {
      updateData.group = group;
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Run in a transaction: unlink orders first (keep order history),
    // then delete message logs, then delete the customer record.
    await prisma.$transaction([
      // Unlink orders so historical order records are preserved
      prisma.order.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      }),
      // Delete message logs tied to this customer
      prisma.messageLog.deleteMany({
        where: { customerId: id },
      }),
      // Delete the customer
      prisma.customer.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
