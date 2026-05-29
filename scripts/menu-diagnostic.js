require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("=== MENU DIAGNOSTIC ===");
  const items = await prisma.menuItem.findMany({
    include: {
      category: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Found ${items.length} total menu items in database:`);
  
  // Track duplicates
  const counts = {};
  items.forEach(i => {
    const key = i.name.toLowerCase().trim();
    counts[key] = (counts[key] || 0) + 1;
  });

  items.forEach(i => {
    const key = i.name.toLowerCase().trim();
    const isDup = counts[key] > 1;
    console.log(`- [${i.id.substring(0,8)}] ${i.name} (${i.category?.name || 'No Cat'})`);
    console.log(`  Price: ₹${i.basePrice} | Available: ${i.isAvailable}`);
    console.log(`  Image: ${i.imageUrl}`);
    if (isDup) {
      console.log(`  ⚠️ DUPLICATE DETECTED! There are ${counts[key]} items with this name.`);
    }
  });

  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
