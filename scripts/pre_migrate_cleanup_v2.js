const { Client } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  if (!connectionString) {
    console.error("No connection string found in .env");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Connected successfully. Starting cleanup transaction...");
    await client.query("BEGIN");

    // 1. Seed missing customer records from Orders to guarantee referential integrity
    console.log("Seeding missing Customer records from Order table...");
    await client.query(`
      INSERT INTO "Customer" (phone, name, "totalSpent", "totalOrders", "updatedAt", "createdAt")
      SELECT DISTINCT "customerPhone", COALESCE(MAX("customerName"), 'Guest'), 0, 0, NOW(), NOW()
      FROM "Order"
      WHERE "customerPhone" IS NOT NULL 
        AND TRIM("customerPhone") != '' 
        AND "customerPhone" NOT IN (SELECT phone FROM "Customer")
      GROUP BY "customerPhone"
    `);

    // 2. Seed missing customer records from MessageLog
    console.log("Seeding missing Customer records from MessageLog table...");
    await client.query(`
      INSERT INTO "Customer" (phone, name, "totalSpent", "totalOrders", "updatedAt", "createdAt")
      SELECT DISTINCT "phone", 'Guest', 0, 0, NOW(), NOW()
      FROM "MessageLog"
      WHERE "phone" IS NOT NULL 
        AND TRIM("phone") != '' 
        AND "phone" NOT IN (SELECT phone FROM "Customer")
      GROUP BY "phone"
    `);

    // 3. Drop existing foreign key constraints if they exist
    console.log("Dropping existing constraints...");
    try {
      await client.query('ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey"');
      await client.query('ALTER TABLE "MessageLog" DROP CONSTRAINT IF EXISTS "MessageLog_customerId_fkey"');
    } catch (e) {
      console.log("Constraint drop info:", e.message);
    }

    // 4. Update order.customerId to point to order.customerPhone
    console.log("Mapping Order customerId to customerPhone...");
    await client.query(`
      UPDATE "Order" 
      SET "customerId" = "customerPhone" 
      WHERE "customerPhone" IS NOT NULL AND TRIM("customerPhone") != ''
    `);

    // 5. Update messageLog.customerId to point to messageLog.phone
    console.log("Mapping MessageLog customerId to phone...");
    await client.query(`
      UPDATE "MessageLog" 
      SET "customerId" = "phone" 
      WHERE "phone" IS NOT NULL AND TRIM("phone") != ''
    `);

    // 6. Set any invalid/empty customerId references to NULL
    console.log("Setting invalid customerId references to NULL...");
    await client.query(`
      UPDATE "Order" 
      SET "customerId" = NULL 
      WHERE "customerId" NOT IN (SELECT phone FROM "Customer")
    `);
    
    await client.query(`
      UPDATE "MessageLog" 
      SET "customerId" = NULL 
      WHERE "customerId" NOT IN (SELECT phone FROM "Customer")
    `);

    await client.query("COMMIT");
    console.log("PostgreSQL cleanup and mapping successfully committed!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during pre-migration cleanup:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
