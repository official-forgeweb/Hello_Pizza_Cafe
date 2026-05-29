import { Suspense } from "react";
import prisma from "@/lib/prisma";
import MenuContentClient from "@/components/menu/MenuContentClient";
import MenuLoading from "./loading";

export const revalidate = 10; // Enable ISR: cache page and revalidate every 10s in background

// Child server component that handles asynchronous data loading
async function MenuPageContent() {
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

  // Transform items
  const transformedItems = items.map((i: any) => ({
    ...i,
    price: Number(i.basePrice || i.price),
    isVeg: i.itemType === "VEG" || i.isVeg === true
  }));

  // De-duplicate items by name WITHIN the same category
  const uniqueItemsMap = new Map<string, any>();
  for (const item of transformedItems) {
    const key = `${item.name.toLowerCase().trim()}-${item.categoryId}`;
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
    <MenuContentClient 
      initialCategories={allCategories} 
      initialMenuItems={filteredTransformedItems} 
    />
  );
}

// Synchronous wrapper that renders instantly and delegates loading states to Suspense loading.tsx
export default function MenuPage() {
  return (
    <Suspense fallback={<MenuLoading />}>
      <MenuPageContent />
    </Suspense>
  );
}
