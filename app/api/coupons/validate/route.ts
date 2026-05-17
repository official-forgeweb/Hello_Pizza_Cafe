import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal, items, customerPhone } = await request.json();

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

    // Check Applicable Days
    if (coupon.applicableDays && coupon.applicableDays.length > 0) {
      const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      if (!coupon.applicableDays.includes(currentDay)) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return NextResponse.json({ valid: false, error: `This coupon is only valid on ${coupon.applicableDays.map(d => days[d]).join(', ')}` });
      }
    }

    // Check First Order Only (If customerPhone is provided)
    if (coupon.isFirstOrderOnly && customerPhone) {
      const pastOrders = await prisma.order.count({
        where: { customerPhone, status: { not: "CANCELLED" } }
      });
      if (pastOrders > 0) {
        return NextResponse.json({ valid: false, error: "This coupon is only valid for your first order" });
      }
    }

    let discount = 0;

    // Standard Percentage or Fixed
    if (coupon.type === "STANDARD" || !coupon.type) {
      if (coupon.discountType === "PERCENTAGE") {
        discount = Math.round(orderTotal * (Number(coupon.discountValue) / 100));
        if (coupon.maxDiscount) {
          discount = Math.min(discount, Number(coupon.maxDiscount));
        }
      } else {
        discount = Number(coupon.discountValue);
      }
    } 
    // BOGO Logic
    else if (coupon.type === "BOGO" && items && Array.isArray(items)) {
      // Find all items in the cart that match the applicable rules
      const applicableCartItems = items.filter((item: any) => {
        // If applicableItems array is empty, all items apply. Otherwise, check if variant name matches
        if (!coupon.applicableItems || coupon.applicableItems.length === 0) return true;
        const variantName = item.variant?.name?.toLowerCase() || "";
        return coupon.applicableItems.some(i => variantName.includes(i.toLowerCase()));
      });

      // BOGO requires at least 2 applicable items
      const totalApplicableQuantity = applicableCartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      if (totalApplicableQuantity < 2) {
        return NextResponse.json({ valid: false, error: "Buy 1 Get 1 requires at least 2 applicable items (e.g. Large pizzas)" });
      }

      // Flatten items to apply BOGO on the cheapest ones
      let flatItems: number[] = [];
      applicableCartItems.forEach((item: any) => {
        const price = item.variant?.price || item.price;
        for (let i = 0; i < item.quantity; i++) {
          flatItems.push(price);
        }
      });

      // Sort descending (most expensive first)
      flatItems.sort((a, b) => b - a);

      // For every 2 items, the 2nd (cheaper) is free
      let freeCount = Math.floor(flatItems.length / 2);
      
      // Calculate discount (sum of cheapest `freeCount` items)
      for (let i = 0; i < freeCount; i++) {
        discount += flatItems[flatItems.length - 1 - i];
      }
      
      // Apply max discount if any
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
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
