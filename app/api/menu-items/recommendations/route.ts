import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/menu-items/recommendations?cartCategoryIds=cat1,cat2&excludeIds=id1,id2&limit=6
 * 
 * Smart recommendations logic:
 * - If cart has pizzas → suggest sides, beverages, desserts
 * - If cart has burgers → suggest fries, beverages, desserts
 * - If cart has sides → suggest beverages, desserts
 * - Always exclude items already in cart
 * - Prioritize bestsellers
 * - Fill remaining slots with popular items from other categories
 */

// Category pairing rules: if cart has items from these categories, suggest from paired categories
const PAIRING_KEYWORDS: Record<string, string[]> = {
  // If cart has pizza → suggest these
  "pizza": ["beverage", "cold drink", "drink", "dessert", "side", "bread", "fries", "dip", "soup", "salad"],
  // If cart has burger → suggest these
  "burger": ["fries", "beverage", "cold drink", "drink", "dessert", "side", "shake"],
  // If cart has pasta → suggest these
  "pasta": ["bread", "beverage", "cold drink", "drink", "dessert", "soup", "salad"],
  // If cart has chinese → suggest these
  "chinese": ["soup", "beverage", "cold drink", "drink", "rice", "noodle", "dessert"],
  // If cart has dosa → suggest these
  "dosa": ["beverage", "cold drink", "drink", "chutney", "side"],
  // If cart has sides → suggest these
  "side": ["beverage", "cold drink", "drink", "dessert"],
  "bread": ["beverage", "cold drink", "drink", "dessert"],
  "fries": ["beverage", "cold drink", "drink"],
  // If cart has beverages → suggest desserts
  "beverage": ["dessert"],
  "cold drink": ["dessert"],
  "drink": ["dessert"],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartCategoryIds = searchParams.get("cartCategoryIds")?.split(",").filter(Boolean) || [];
    const excludeIds = searchParams.get("excludeIds")?.split(",").filter(Boolean) || [];
    const limit = parseInt(searchParams.get("limit") || "8");

    // Step 1: Get category names for items in cart
    let cartCategoryNames: string[] = [];
    if (cartCategoryIds.length > 0) {
      const cartCategories = await prisma.category.findMany({
        where: { id: { in: cartCategoryIds } },
        select: { name: true },
      });
      cartCategoryNames = cartCategories.map(c => c.name.toLowerCase());
    }

    // Step 2: Find paired category keywords based on what's in the cart
    const targetKeywords = new Set<string>();
    for (const catName of cartCategoryNames) {
      for (const [keyword, pairings] of Object.entries(PAIRING_KEYWORDS)) {
        if (catName.includes(keyword)) {
          pairings.forEach(p => targetKeywords.add(p));
        }
      }
    }

    // Step 3: Find categories matching the paired keywords
    let pairedCategoryIds: string[] = [];
    if (targetKeywords.size > 0) {
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
      
      pairedCategoryIds = allCategories
        .filter(cat => {
          const name = cat.name.toLowerCase();
          return Array.from(targetKeywords).some(kw => name.includes(kw));
        })
        .map(cat => cat.id);
    }

    // Step 4: Fetch recommended items
    let recommendations: any[] = [];

    if (pairedCategoryIds.length > 0) {
      // Get items from paired categories, prioritizing bestsellers
      recommendations = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          categoryId: { in: pairedCategoryIds },
          id: { notIn: excludeIds },
        },
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: [
          { isBestSeller: "desc" },
          { totalOrders: "desc" },
          { displayOrder: "asc" },
        ],
        take: limit,
      });
    }

    // Step 5: If we don't have enough, fill with bestsellers from any category
    if (recommendations.length < limit) {
      const existingIds = [...excludeIds, ...recommendations.map(r => r.id)];
      const fillers = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          id: { notIn: existingIds },
          // Exclude categories already in cart (don't suggest more pizza if they have pizza)
          ...(cartCategoryIds.length > 0 ? { categoryId: { notIn: cartCategoryIds } } : {}),
        },
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: [
          { isBestSeller: "desc" },
          { totalOrders: "desc" },
        ],
        take: limit - recommendations.length,
      });
      recommendations = [...recommendations, ...fillers];
    }

    // Format the response
    const formatted = recommendations.map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.basePrice),
      imageUrl: item.imageUrl,
      isVeg: item.itemType === "VEG",
      isBestSeller: item.isBestSeller,
      categoryId: item.categoryId,
      categoryName: item.category?.name || "",
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Recommendations error:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array, don't break cart
  }
}
