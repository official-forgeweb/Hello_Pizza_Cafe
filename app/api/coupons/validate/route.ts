import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "Coupon is no longer active" });
    }
    if (coupon.validFrom && new Date() < coupon.validFrom) {
      return NextResponse.json({ valid: false, error: "Coupon is not yet valid" });
    }
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return NextResponse.json({ valid: false, error: "Coupon has expired" });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }
    if (orderTotal && orderTotal < Number(coupon.minimumOrder)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of ₹${coupon.minimumOrder} required`,
      });
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.round(orderTotal * (Number(coupon.discountValue) / 100));
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    return NextResponse.json({
      valid: true,
      discount,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
