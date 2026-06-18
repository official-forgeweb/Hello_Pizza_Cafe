require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const counts = await prisma.menuItemAddOn.groupBy({
    by: ['variantName'],
    _count: {
      id: true
    }
  });

  console.log('MenuItemAddOn counts by variantName:');
  console.log(counts);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
