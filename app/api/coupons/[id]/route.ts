import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Parse validFrom and validUntil as proper dates or null
    const validFrom = body.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        code: body.code,
        description: body.description,
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        minimumOrder: Number(body.minimumOrder),
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        isActive: body.isActive,
        type: body.type,
        isFirstOrderOnly: body.isFirstOrderOnly,
        applicableDays: body.applicableDays || [],
        applicableItems: body.applicableItems || [],
        validFrom,
        validUntil,
      },
    });
    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.coupon.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
