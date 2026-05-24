require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true,
      basePrice: true,
      isAvailable: true,
    }
  });

  const nameMap = {};
  items.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (!nameMap[key]) {
      nameMap[key] = [];
    }
    nameMap[key].push(item);
  });

  console.log('--- DUPLICATE ITEMS ---');
  let duplicateCount = 0;
  for (const name in nameMap) {
    if (nameMap[name].length > 1) {
      duplicateCount++;
      console.log(`Item: "${nameMap[name][0].name}"`);
      nameMap[name].forEach(item => {
        console.log(`  ID: ${item.id}, Price: ${item.basePrice}, Available: ${item.isAvailable}`);
      });
    }
  }
  console.log(`Total duplicates: ${duplicateCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => pool.end()));
