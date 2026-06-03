/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 3600; // Cache page and revalidate in background every hour (ISR)

export default async function HomePage() {
  // Query DB directly in parallel on the server
  const [categories, slides, bestSellersRaw] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true, isBestSeller: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      take: 8,
    }),
  ]);

  let items = bestSellersRaw;

  // If no items have the isBestSeller flag set, fetch popular categories as fallback
  if (items.length < 4) {
    const fallbackItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      take: 30,
    });

    const withImages = fallbackItems.filter((i: any) => i.imageUrl && i.imageUrl !== "null");
    const pizzas = withImages.filter(
      (i: any) =>
        i.name.toLowerCase().includes("pizza") ||
        (i.category && i.category.name.toLowerCase().includes("pizza"))
    );
    const others = withImages.filter(
      (i: any) =>
        !i.name.toLowerCase().includes("pizza") &&
        (!i.category || !i.category.name.toLowerCase().includes("pizza"))
    );
    items = [...items, ...pizzas, ...others];
  }

  // Deduplicate and filter out items without images
  const seen = new Set<string>();
  const finalBestSellers = items
    .filter((i: any) => {
      const normalizedName = i.name?.toLowerCase()?.trim() || "";
      if (!i.imageUrl || i.imageUrl === "null" || !normalizedName || seen.has(normalizedName))
        return false;
      seen.add(normalizedName);
      return true;
    })
    .slice(0, 8);

  // Serialize DB types (Decimals, Dates) safely for client component props
  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    imageUrl: c.imageUrl || null,
    icon: c.icon || null,
    displayOrder: c.displayOrder,
    isActive: c.isActive,
  }));

  const serializedSlides = slides.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description || null,
    imageUrl: s.imageUrl,
    tag: s.tag,
    discount: s.discount || null,
    linkUrl: s.linkUrl || null,
    displayOrder: s.displayOrder,
    isActive: s.isActive,
  }));

  const serializedBestSellers = finalBestSellers.map((i: any) => ({
    id: i.id,
    categoryId: i.categoryId,
    name: i.name,
    slug: i.slug,
    description: i.description || null,
    shortDescription: i.shortDescription || null,
    price: Number(i.basePrice || 0),
    imageUrl: i.imageUrl || null,
    thumbnailUrl: i.thumbnailUrl || null,
    isVeg: i.itemType === "VEG",
    isBestSeller: true,
    category: i.category
      ? {
          id: i.category.id,
          name: i.category.name,
          slug: i.category.slug,
        }
      : undefined,
  }));

  return (
    <HomeClient
      initialCategories={serializedCategories}
      initialAds={serializedSlides}
      initialBestSellers={serializedBestSellers}
    />
  );
}
