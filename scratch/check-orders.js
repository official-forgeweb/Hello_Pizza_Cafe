const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Fetching today's orders ---");
  const orders = await prisma.order.findMany({
    where: {
      placedAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
      }
    },
    include: {
      customer: true
    }
  });

  console.log(`Found ${orders.length} orders placed today.`);
  orders.forEach(o => {
    console.log(`Order: ${o.orderNumber}
Customer Name: ${o.customerName}
Customer Phone: ${o.customerPhone}
Total Amount: ${o.totalAmount}
Status: ${o.status}
waConfirmationSent: ${o.waConfirmationSent}
placedAt: ${o.placedAt.toISOString()}
---`);
  });

  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("--- Recent message logs ---");
  logs.forEach(l => {
    console.log(`ID: ${l.id} | Phone: ${l.phone} | Type: ${l.messageType} | Status: ${l.status} | CreatedAt: ${l.createdAt.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
