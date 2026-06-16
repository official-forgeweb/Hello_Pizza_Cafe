const { Client } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const custCount = await client.query('SELECT COUNT(*) FROM "Customer"');
  console.log("Customer count:", custCount.rows[0].count);

  const orderCount = await client.query('SELECT COUNT(*) FROM "Order"');
  console.log("Order count:", orderCount.rows[0].count);

  const orderCustIdSample = await client.query('SELECT "customerId", COUNT(*) FROM "Order" GROUP BY "customerId" LIMIT 10');
  console.log("Order customerId samples:\n", orderCustIdSample.rows);

  const customerPhoneSample = await client.query('SELECT "phone" FROM "Customer" LIMIT 10');
  console.log("Customer phone samples:\n", customerPhoneSample.rows);

  // Check how many orders have customerId that does not exist in Customer.phone
  const orphanedOrders = await client.query(`
    SELECT COUNT(*) 
    FROM "Order" 
    WHERE "customerId" IS NOT NULL 
      AND "customerId" NOT IN (SELECT "phone" FROM "Customer")
  `);
  console.log("Orphaned orders (customerId not matching Customer.phone):", orphanedOrders.rows[0].count);

  await client.end();
}
run();
