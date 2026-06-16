import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      value,
      minOrderAmount,
      applicableItems,
      isActive,
      validFrom,
      validUntil,
      applicableDays,
      startTime,
      endTime,
    } = body;

    const discount = await prisma.cloudDiscountRule.update({
      where: { id },
      data: {
        name,
        type,
        value: value !== undefined ? Number(value) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : undefined,
        applicableItems: applicableItems || undefined,
        isActive: isActive ?? undefined,
        validFrom: validFrom ? new Date(validFrom) : (validFrom === null ? null : undefined),
        validUntil: validUntil ? new Date(validUntil) : (validUntil === null ? null : undefined),
        applicableDays: Array.isArray(applicableDays) ? applicableDays.map(Number) : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(discount);
  } catch (error: any) {
    console.error("Error in PUT discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.cloudDiscountRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Discount rule deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
