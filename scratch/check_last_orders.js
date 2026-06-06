/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking order 260606505...");
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: "260606505" },
        { orderNumber: { contains: "260606505" } }
      ]
    },
    include: {
      items: true
    }
  });

  console.log("Found order:", order);

  console.log("\nChecking last 5 orders:");
  const lastOrders = await prisma.order.findMany({
    orderBy: { placedAt: "desc" },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      placedAt: true,
      status: true,
      totalAmount: true
    }
  });
  console.log(lastOrders);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
