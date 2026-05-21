import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('Deleting non-veg categories and items...');

  // 1. Delete all non-veg items
  const deletedItems = await prisma.menuItem.deleteMany({
    where: {
      OR: [
        { itemType: 'NON_VEG' },
        { category: { name: { contains: 'Non-Veg', mode: 'insensitive' } } }
      ]
    }
  });
  console.log(`Deleted ${deletedItems.count} non-veg items.`);

  // 2. Delete non-veg categories
  const deletedCats = await prisma.category.deleteMany({
    where: {
      name: { contains: 'Non-Veg', mode: 'insensitive' }
    }
  });
  console.log(`Deleted ${deletedCats.count} non-veg categories.`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
