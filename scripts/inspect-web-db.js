const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  require('dotenv').config();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== Web Database Message Log Inspection ===\n');

  const orders = await prisma.order.findMany({
    where: {
      orderNumber: { in: ['260616001', '260616002', '260616003'] }
    },
    include: {
      messageLogs: true
    }
  });

  for (const o of orders) {
    console.log(`Order# ${o.orderNumber}:`);
    console.log(`  WA Confirmation Sent: ${o.waConfirmationSent}`);
    console.log(`  Message Logs (${o.messageLogs.length}):`);
    o.messageLogs.forEach(l => {
      console.log(`    LogID: ${l.id} | Phone: ${l.phone} | Status: ${l.status} | Template: ${l.templateUsed} | CreatedAt: ${l.createdAt.toISOString()}`);
    });
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
