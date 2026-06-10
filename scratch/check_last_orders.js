/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\nChecking last 20 orders with detailed items:");
  const lastOrders = await prisma.order.findMany({
    orderBy: { placedAt: "desc" },
    take: 20,
    include: {
      items: {
        include: {
          addOns: true
        }
      }
    }
  });
  
  for (const order of lastOrders) {
    console.log(`Order Number: ${order.orderNumber} | Date: ${order.placedAt.toISOString()} | Status: ${order.status} | Total: ${order.totalAmount}`);
    for (const item of order.items) {
      console.log(`  - Item Name: "${item.itemName}" | Qty: ${item.quantity} | Variant: "${item.variantName}" | BasePrice: ${item.basePrice} | VariantPrice: ${item.variantPrice} | ItemTotal: ${item.itemTotal}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
