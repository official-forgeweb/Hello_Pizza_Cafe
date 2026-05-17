import prisma from '../lib/prisma';

async function main() {
  console.log("Starting category deduplication cleanup...");

  // Get all categories ordered by creation date (so we keep the oldest one)
  const allCategories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const categoryMap = new Map<string, string>(); // name -> id of the first (primary) category

  let deletedCount = 0;
  let reassignedCount = 0;

  for (const cat of allCategories) {
    const name = cat.name.trim().toLowerCase();

    if (categoryMap.has(name)) {
      // This is a duplicate. We need to move its items and delete it.
      const primaryCatId = categoryMap.get(name)!;

      // Find all items belonging to this duplicate category
      const itemsToMove = await prisma.menuItem.findMany({
        where: { categoryId: cat.id }
      });

      if (itemsToMove.length > 0) {
        // Reassign items to the primary category
        await prisma.menuItem.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: primaryCatId }
        });
        reassignedCount += itemsToMove.length;
      }

      // Delete the duplicate category
      await prisma.category.delete({
        where: { id: cat.id }
      });

      deletedCount++;
      console.log(`Deleted duplicate category: "${cat.name}" (ID: ${cat.id})`);
    } else {
      // First time seeing this category name, mark it as the primary one
      categoryMap.set(name, cat.id);
    }
  }

  // Also remove the "fake" cat1 if it exists
  const fakeCat = await prisma.category.findUnique({ where: { id: "cat1" }});
  if (fakeCat) {
    await prisma.menuItem.updateMany({ where: { categoryId: "cat1" }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id: "cat1" }});
    console.log("Deleted fake mock category 'cat1'.");
  }

  console.log("-----------------------------------------");
  console.log(`Cleanup Complete!`);
  console.log(`Kept ${categoryMap.size} unique categories.`);
  console.log(`Deleted ${deletedCount} duplicate categories.`);
  console.log(`Reassigned ${reassignedCount} menu items to their correct primary category.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
