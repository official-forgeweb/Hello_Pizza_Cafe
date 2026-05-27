require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const phones = ["9310827885", "9873767346", "7819932276", "8920412155", "701610289"];
  console.log("Checking customer records and order links...");

  for (const phone of phones) {
    const customer = await prisma.customer.findFirst({
      where: { phone }
    });

    if (!customer) {
      console.log(`\nPhone: ${phone} - Customer NOT found in database`);
      continue;
    }

    console.log(`\nCustomer Found: ${customer.name} (ID: ${customer.id}, Phone: ${customer.phone})`);
    console.log(`Current stats: totalOrders=${customer.totalOrders}, totalSpent=₹${customer.totalSpent}`);

    // Check if there are orders linked to this customer ID
    const ordersLinked = await prisma.order.findMany({
      where: { customerId: customer.id }
    });
    console.log(`Orders linked by customerId: ${ordersLinked.length}`);
    if (ordersLinked.length > 0) {
      ordersLinked.forEach(o => console.log(`  - Order ${o.id} (${o.orderNumber}): Status=${o.status}, Amount=₹${o.totalAmount}`));
    }

    // Check if there are orders in the DB with this phone number but NOT linked to this customer ID
    const ordersWithPhone = await prisma.order.findMany({
      where: {
        customerPhone: phone,
        OR: [
          { customerId: null },
          { customerId: { not: customer.id } }
        ]
      }
    });
    console.log(`Orders with this phone but not linked to this customerId: ${ordersWithPhone.length}`);
    if (ordersWithPhone.length > 0) {
      ordersWithPhone.forEach(o => console.log(`  - Order ${o.id} (${o.orderNumber}): customerId=${o.customerId}, Status=${o.status}, Amount=₹${o.totalAmount}`));
    }
  }

  // Count total orders in the database
  const totalOrdersCount = await prisma.order.count();
  console.log(`\nTotal Orders in DB: ${totalOrdersCount}`);

  // Count total customers in the database
  const totalCustomersCount = await prisma.customer.count();
  console.log(`Total Customers in DB: ${totalCustomersCount}`);

  // Count orders without a customerId
  const ordersWithoutCustomer = await prisma.order.count({
    where: { customerId: null }
  });
  console.log(`Orders without customerId: ${ordersWithoutCustomer}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
