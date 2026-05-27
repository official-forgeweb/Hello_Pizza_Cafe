import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // VEG, NON_VEG
    const bestSellers = searchParams.get("bestSellers");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const isAdmin = searchParams.get("admin") === "true";

    const where: Record<string, unknown> = {};

    // Only filter for available items if not an admin
    if (!isAdmin) {
      where.isAvailable = true;
    }

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

    const uniqueItemsMap = new Map<string, any>();
    for (const item of items) {
      const key = item.name.toLowerCase().trim();
      const price = Number(item.basePrice || 0);
      const existing = uniqueItemsMap.get(key);
      if (!existing) {
        uniqueItemsMap.set(key, item);
      } else {
        const existingPrice = Number(existing.basePrice || 0);
        if (price > existingPrice) {
          uniqueItemsMap.set(key, item);
        }
      }
    }
    const filteredItems = Array.from(uniqueItemsMap.values());

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isAdmin) {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
    } else {
      headers["Cache-Control"] = "public, s-maxage=10, stale-while-revalidate=60";
    }

    return NextResponse.json({
      items: filteredItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit),
      },
    }, {
      headers
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
    
    if (!data.categoryId || data.categoryId === "") {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    
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

    revalidatePath("/menu");
    revalidatePath("/");
    revalidatePath("/api/menu-items");

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
