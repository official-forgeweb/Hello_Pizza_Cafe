import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const addons = await prisma.addOn.findMany({
      orderBy: [{ addonGroup: "asc" }, { displayOrder: "asc" }],
    });
    return NextResponse.json(addons);
  } catch (error) {
    console.error("Failed to fetch addons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const addon = await prisma.addOn.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price || 0,
        addonGroup: body.addonGroup || "Toppings",
        itemType: body.itemType || "VEG",
        isAvailable: body.isAvailable ?? true,
        displayOrder: body.displayOrder ?? 0,
      },
    });
    return NextResponse.json(addon, { status: 201 });
  } catch (error) {
    console.error("Failed to create addon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
