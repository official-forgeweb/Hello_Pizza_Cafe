import { Suspense } from "react";
import prisma from "@/lib/prisma";
import MenuContentClient from "@/components/menu/MenuContentClient";

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function MenuPage() {
  // Fetch data on the server
  const [categories, items] = await Promise.all([
    prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
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
    })
  ]);

  // Transform items as done in the client previously
  const transformedItems = items.map((i: any) => ({
    ...i,
    price: Number(i.basePrice || i.price),
    isVeg: i.itemType === "VEG" || i.isVeg === true
  }));

  // De-duplicate items by name (case-insensitive) - keep the one with the greater price
  const uniqueItemsMap = new Map<string, any>();
  for (const item of transformedItems) {
    const key = item.name.toLowerCase().trim();
    const existing = uniqueItemsMap.get(key);
    if (!existing) {
      uniqueItemsMap.set(key, item);
    } else {
      if (item.price > existing.price) {
        uniqueItemsMap.set(key, item);
      }
    }
  }
  const filteredTransformedItems = Array.from(uniqueItemsMap.values());

  const allCategories = [{ id: "all", name: "All" }, ...categories];

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-warm-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MenuContentClient 
        initialCategories={allCategories} 
        initialMenuItems={filteredTransformedItems} 
      />
    </Suspense>
  );
}
