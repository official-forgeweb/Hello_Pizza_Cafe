require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const items = await prisma.menuItem.findMany({
    where: {
      name: {
        in: ['Pudina Chap Tikka', 'Rumali Roti', 'Tandoori Malai Chap', 'Rumali Roti.'],
        mode: 'insensitive'
      }
    },
    include: {
      category: { select: { name: true } }
    }
  });

  console.log(`Found ${items.length} items:`);
  items.forEach(i => {
    console.log(`- [${i.id}] ${i.name} (Category: ${i.category?.name})`);
    console.log(`  basePrice: ${i.basePrice}`);
    console.log(`  imageUrl: ${i.imageUrl}`);
    console.log(`  thumbnailUrl: ${i.thumbnailUrl}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
