import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse validFrom and validUntil as proper dates or null
    const validFrom = body.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code,
        description: body.description,
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        minimumOrder: Number(body.minimumOrder),
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        isActive: body.isActive ?? true,
        type: body.type || "STANDARD",
        isFirstOrderOnly: body.isFirstOrderOnly ?? false,
        applicableDays: body.applicableDays || [],
        applicableItems: body.applicableItems || [],
        validFrom,
        validUntil,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
