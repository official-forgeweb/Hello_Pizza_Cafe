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

  // Transform items to resolve decimal serialization issue and guarantee correct numeric calculations
  const transformedItems = items.map((i: any) => {
    const basePriceNum = Number(i.basePrice || i.price || 0);
    
    // Map variants price decimals to numbers
    const variants = i.variants?.map((v: any) => ({
      ...v,
      price: Number(v.price || 0)
    })) || [];
    
    // Map addOns price decimals to numbers
    const addOns = i.addOns?.map((a: any) => ({
      ...a,
      addOn: a.addOn ? {
        ...a.addOn,
        price: Number(a.addOn.price || 0)
      } : null
    })) || [];

    return {
      ...i,
      basePrice: basePriceNum,
      price: basePriceNum,
      isVeg: i.itemType === "VEG" || i.isVeg === true,
      variants,
      addOns
    };
  });

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
  
  // Clean all custom non-serializable objects (like Prisma Decimal and Dates) safely
  const serializedItems = JSON.parse(JSON.stringify(filteredTransformedItems));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const allCategories = [{ id: "all", name: "All" }, ...serializedCategories];

  return (
    <MenuContentClient 
      initialCategories={allCategories} 
      initialMenuItems={serializedItems} 
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
