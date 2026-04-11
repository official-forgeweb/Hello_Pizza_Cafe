import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // VEG, NON_VEG
    const bestSellers = searchParams.get("bestSellers");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      isAvailable: true,
    };

    if (categoryId) where.categoryId = categoryId;
    if (type) where.itemType = type;
    if (bestSellers === "true") where.isBestSeller = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { isAvailable: true },
            orderBy: { displayOrder: "asc" },
          },
          addOns: {
            include: {
              addOn: true,
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.menuItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}
