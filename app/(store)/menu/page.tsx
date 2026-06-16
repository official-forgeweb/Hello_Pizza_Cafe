/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import MenuContentClient from "@/components/menu/MenuContentClient";
import MenuLoading from "./loading";

export const revalidate = 3600; // Enable ISR: cache page and revalidate every hour in background

// Child server component that handles asynchronous data loading
async function MenuPageContent() {
  const [categories, items, discounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: { displayOrder: "asc" }
        },
        addOns: {
          include: { addOn: true }
        },
        _count: {
          select: {
            variants: true,
            addOns: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.cloudDiscountRule.findMany({
      where: { isActive: true }
    })
  ]);

  // Transform items to resolve decimal serialization issue and guarantee correct numeric calculations
  const transformedItems = items.map((i: any) => {
    const basePriceNum = Number(i.basePrice || i.price || 0);

    const variantsMapped = i.variants?.map((v: any) => ({
      ...v,
      price: Number(v.priceModifier || (v as any).price || 0),
      priceModifier: Number(v.priceModifier || 0)
    })) || [];

    const addOnsMapped = i.addOns?.map((a: any) => ({
      ...a,
      addOn: a.addOn ? {
        ...a.addOn,
        price: Number(a.addOn.price || 0)
      } : null
    })) || [];

    const defaultVariant = variantsMapped.find((v: any) => v.isDefault) || variantsMapped[0];
    const displayPrice = defaultVariant ? Number(defaultVariant.priceModifier || 0) : basePriceNum;
    
    const hasVariants = i._count
      ? (i._count.variants > 0 || i._count.addOns > 0)
      : false;

    return {
      ...i,
      basePrice: basePriceNum,
      price: displayPrice,
      isVeg: i.itemType === "VEG" || i.isVeg === true,
      hasVariants,
      variants: variantsMapped,
      addOns: addOnsMapped
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
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));
  const allCategories = [{ id: "all", name: "All" }, ...serializedCategories];

  return (
    <MenuContentClient 
      initialCategories={allCategories} 
      initialMenuItems={serializedItems} 
      initialDiscounts={serializedDiscounts}
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
