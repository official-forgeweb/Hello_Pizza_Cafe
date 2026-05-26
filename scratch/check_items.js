require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let out = "";
  const log = (msg) => {
    out += msg + "\n";
  };

  try {
    const items = await prisma.menuItem.findMany({
      include: {
        category: true
      }
    });

    log(`Total menu items in DB: ${items.length}`);
    
    // Group by name
    const grouped = {};
    for (const item of items) {
      const nameKey = item.name.toLowerCase().trim();
      if (!grouped[nameKey]) grouped[nameKey] = [];
      grouped[nameKey].push(item);
    }

    log("\n--- Checking duplicates ---");
    let duplicateCount = 0;
    for (const name in grouped) {
      if (grouped[name].length > 1) {
        duplicateCount++;
        log(`\nDuplicate item: "${grouped[name][0].name}"`);
        for (const item of grouped[name]) {
          log(`  - ID: ${item.id}`);
          log(`    Price: ${item.basePrice}`);
          log(`    Image URL: ${item.imageUrl}`);
          log(`    Created: ${item.createdAt}`);
          log(`    Category: ${item.category?.name} (${item.categoryId})`);
        }
      }
    }
    log(`\nTotal duplicate names: ${duplicateCount}`);

    log("\n--- Checking items with images ---");
    const itemsWithImages = items.filter(i => i.imageUrl);
    log(`Total items with images: ${itemsWithImages.length}`);
    for (const item of itemsWithImages) {
      log(`- ${item.name}: ${item.imageUrl}`);
    }

    fs.writeFileSync('scratch/db_check_results.txt', out);
    console.log("Results written to scratch/db_check_results.txt");

  } catch (error) {
    console.error("Error checking items:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
