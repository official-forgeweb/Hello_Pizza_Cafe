import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const discounts = await prisma.cloudDiscountRule.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(discounts);
  } catch (error: any) {
    console.error("Error in GET discounts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (!name || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields (name, type, value)" }, { status: 400 });
    }

    const discount = await prisma.cloudDiscountRule.create({
      data: {
        name,
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount ?? 0),
        applicableItems: applicableItems || [],
        isActive: isActive ?? true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        applicableDays: Array.isArray(applicableDays) ? applicableDays.map(Number) : [],
        startTime: startTime || null,
        endTime: endTime || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST discount:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
