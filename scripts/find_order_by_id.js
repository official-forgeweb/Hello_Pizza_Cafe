require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Checking specific order IDs in Website DB ===');
  
  const id = '07cb7a65-09e7-4dff-bdde-eda195cb4f94';
  const order = await prisma.order.findUnique({
    where: { id: id },
    include: { messageLogs: true }
  });
  console.log('Order:', order);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
