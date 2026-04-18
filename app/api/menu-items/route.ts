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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Generate a unique slug
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const newItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        basePrice: data.price,
        itemType: data.isVeg !== false ? "VEG" : "NON_VEG",
        isAvailable: data.isAvailable ?? true,
        isBestSeller: data.isBestSeller ?? false,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
