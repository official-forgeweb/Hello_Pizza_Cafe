import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
  try {
    const items = await prisma.menuItem.findMany({
      include: {
        category: true
      }
    });

    console.log(`Total menu items in DB: ${items.length}`);
    
    // Group by name
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      const nameKey = item.name.toLowerCase().trim();
      if (!grouped[nameKey]) grouped[nameKey] = [];
      grouped[nameKey].push(item);
    }

    console.log("\n--- Checking duplicates ---");
    let duplicateCount = 0;
    for (const name in grouped) {
      if (grouped[name].length > 1) {
        duplicateCount++;
        console.log(`\nDuplicate item: "${grouped[name][0].name}"`);
        for (const item of grouped[name]) {
          console.log(`  - ID: ${item.id}`);
          console.log(`    Price: ${item.basePrice}`);
          console.log(`    Image URL: ${item.imageUrl}`);
          console.log(`    Created: ${item.createdAt}`);
          console.log(`    Category: ${item.category?.name} (${item.categoryId})`);
        }
      }
    }
    console.log(`\nTotal duplicate names: ${duplicateCount}`);

    console.log("\n--- Checking items with images ---");
    const itemsWithImages = items.filter(i => i.imageUrl);
    console.log(`Total items with images: ${itemsWithImages.length}`);
    for (const item of itemsWithImages) {
      console.log(`- ${item.name}: ${item.imageUrl}`);
    }

  } catch (error) {
    console.error("Error checking items:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
