require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const items = await prisma.menuItem.findMany();

    // Group by imageUrl
    const grouped = {};
    for (const item of items) {
      if (!item.imageUrl) continue;
      if (!grouped[item.imageUrl]) grouped[item.imageUrl] = [];
      grouped[item.imageUrl].push(item);
    }

    console.log("=== Duplicate Image Analysis ===");
    let duplicateImageGroups = 0;
    for (const url in grouped) {
      if (grouped[url].length > 1) {
        duplicateImageGroups++;
        console.log(`\nImage URL: ${url}`);
        console.log(`Shared by ${grouped[url].length} items:`);
        for (const item of grouped[url]) {
          console.log(`  - "${item.name}" (ID: ${item.id})`);
        }
      }
    }

    console.log(`\nTotal image URLs shared by multiple items: ${duplicateImageGroups}`);

  } catch (error) {
    console.error("Failed to run analysis:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
