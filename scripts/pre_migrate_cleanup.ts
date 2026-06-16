import { Client } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

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

    // 1. Set default phone for empty/null phones to avoid constraint violations
    console.log("Fixing empty/null phone numbers...");
    await client.query(`
      UPDATE "Customer" 
      SET phone = 'UNKNOWN_' || SUBSTRING(id::text, 1, 8)
      WHERE phone IS NULL OR TRIM(phone) = ''
    `);

    // 2. Fetch duplicate customers by phone number
    console.log("Finding duplicate customer records by phone...");
    const dupRes = await client.query(`
      SELECT phone, COUNT(*) as cnt 
      FROM "Customer" 
      GROUP BY phone 
      HAVING COUNT(*) > 1
    `);

    console.log(`Found ${dupRes.rows.length} duplicate phone numbers.`);

    for (const row of dupRes.rows) {
      const phone = row.phone;
      console.log(`Deduplicating phone: ${phone}`);

      // Fetch all duplicates for this phone
      const custRes = await client.query({
        text: `SELECT id, name, "totalOrders", "totalSpent", "lastOrderDate", "updatedAt" FROM "Customer" WHERE phone = $1`,
        values: [phone]
      });

      const records = custRes.rows;
      // Sort: most recent order/billing activity first, or most recent updatedAt
      records.sort((a, b) => {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        
        const updateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return updateB - updateA;
      });

      const master = records[0];
      const dups = records.slice(1);

      console.log(`  Master selected: id=${master.id}, name="${master.name}", orders=${master.totalOrders}`);

      for (const dup of dups) {
        console.log(`  Merging duplicate: id=${dup.id}, name="${dup.name}" -> updating references`);
        // Update Order references
        await client.query({
          text: `UPDATE "Order" SET "customerId" = $1 WHERE "customerId" = $2`,
          values: [master.id, dup.id]
        });

        // Update MessageLog references
        await client.query({
          text: `UPDATE "MessageLog" SET "customerId" = $1 WHERE "customerId" = $2`,
          values: [master.id, dup.id]
        });

        // Delete duplicate customer record
        await client.query({
          text: `DELETE FROM "Customer" WHERE id = $1`,
          values: [dup.id]
        });
      }
    }

    // 3. Clear invalid customerId references in Order and MessageLog
    console.log("Setting invalid customerId references to NULL...");
    await client.query(`
      UPDATE "Order" 
      SET "customerId" = NULL 
      WHERE "customerId" NOT IN (SELECT id FROM "Customer")
    `);
    
    await client.query(`
      UPDATE "MessageLog" 
      SET "customerId" = NULL 
      WHERE "customerId" NOT IN (SELECT id FROM "Customer")
    `);

    // 4. Update the "customerId" field to store the customer's phone number!
    console.log("Mapping customer ID references from UUIDs to phone numbers...");
    
    // First, temporarily allow changing order.customerId by dropping the constraint if it exists (Prisma push will recreate it anyway)
    try {
      await client.query('ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey"');
      await client.query('ALTER TABLE "MessageLog" DROP CONSTRAINT IF EXISTS "MessageLog_customerId_fkey"');
    } catch (e) {
      console.log("Note: Could not drop constraints manually, proceeding...");
    }

    // Update orders customerId from customer UUID to customer phone
    await client.query(`
      UPDATE "Order" o
      SET "customerId" = c.phone
      FROM "Customer" c
      WHERE o."customerId" = c.id
    `);

    // Update message logs customerId from customer UUID to customer phone
    await client.query(`
      UPDATE "MessageLog" m
      SET "customerId" = c.phone
      FROM "Customer" c
      WHERE m."customerId" = c.id
    `);

    await client.query("COMMIT");
    console.log("Deduplication and ID mapping transaction committed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during pre-migration cleanup:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
