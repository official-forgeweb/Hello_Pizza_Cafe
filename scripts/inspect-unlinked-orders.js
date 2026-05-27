require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Analyzing orders without customerId...");
  
  const orders = await prisma.order.findMany({
    where: { customerId: null },
    select: {
      id: true,
      orderNumber: true,
      customerPhone: true,
      customerName: true,
      totalAmount: true
    }
  });

  console.log(`Found ${orders.length} orders without customerId.`);

  let matchCount = 0;
  let uniquePhonesWithCustomers = new Set();
  let uniquePhonesWithoutCustomers = new Set();

  for (const order of orders) {
    if (!order.customerPhone) {
      continue;
    }
    
    // Search for a customer with this phone number
    const customer = await prisma.customer.findFirst({
      where: { phone: order.customerPhone }
    });

    if (customer) {
      matchCount++;
      uniquePhonesWithCustomers.add(order.customerPhone);
      // Let's print the first few matches
      if (matchCount <= 10) {
        console.log(`  Match found: Order ${order.orderNumber} (Phone: ${order.customerPhone}, Name: ${order.customerName}) matches Customer: ${customer.name} (ID: ${customer.id})`);
      }
    } else {
      uniquePhonesWithoutCustomers.add(order.customerPhone);
    }
  }

  console.log(`\nAnalysis Results:`);
  console.log(`- Total orders without customerId: ${orders.length}`);
  console.log(`- Orders that COULD be linked to an existing customer in DB: ${matchCount}`);
  console.log(`- Unique phone numbers that match existing customers: ${uniquePhonesWithCustomers.size}`);
  console.log(`- Unique phone numbers that do NOT match any customer in DB: ${uniquePhonesWithoutCustomers.size}`);
  console.log(`- The unlinked phone numbers:`, Array.from(uniquePhonesWithoutCustomers));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
