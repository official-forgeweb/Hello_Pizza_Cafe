require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Searching for Sunil (9310065542) Orders ===');
  
  const orders = await prisma.order.findMany({
    where: {
      customerPhone: '9310065542',
      placedAt: {
        gte: new Date('2026-06-17T00:00:00.000Z')
      }
    },
    orderBy: { placedAt: 'asc' }
  });

  console.log('Sunil Orders Count:', orders.length);
  for (const o of orders) {
    console.log(`Order# ${o.orderNumber} | ID: ${o.id} | Phone: ${o.customerPhone} | Name: ${o.customerName} | Synced: ${o.isSynced} | WA: ${o.waConfirmationSent} | Placed: ${o.placedAt.toISOString()} | Status: ${o.status}`);
  }

  console.log('=== Checking MessageLogs for Sunil (9310065542) ===');
  const logs = await prisma.messageLog.findMany({
    where: { phone: { contains: '9310065542' } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Logs:', JSON.stringify(logs, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
