const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env file!');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully.');

  // 1. Align customers table schema
  console.log('\n=== Step 1: Aligning "customers" table schema ===');
  try {
    await client.query(`
      ALTER TABLE "customers" 
      ADD COLUMN IF NOT EXISTS "whatsappOptIn" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "group" text DEFAULT 'new',
      ADD COLUMN IF NOT EXISTS "totalOrders" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "totalSpent" numeric(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastOrderDate" timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "lastMessageDate" timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "tags" text[],
      ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now()
    `);
    console.log('✓ "customers" table columns aligned successfully.');
  } catch (e) {
    console.error('✗ Failed to align "customers" table:', e.message);
  }

  // 2. Align loyalty_transactions table schema
  console.log('\n=== Step 2: Aligning "loyalty_transactions" table schema ===');
  try {
    await client.query(`
      ALTER TABLE "loyalty_transactions" ALTER COLUMN "isPending" DROP DEFAULT;
      ALTER TABLE "loyalty_transactions" 
      ALTER COLUMN "isPending" TYPE boolean USING (
        CASE 
          WHEN "isPending" = 1 THEN true 
          WHEN "isPending" = 0 THEN false 
          ELSE "isPending"::boolean 
        END
      );
      ALTER TABLE "loyalty_transactions" ALTER COLUMN "isPending" SET DEFAULT true;
    `);
    console.log('✓ "loyalty_transactions" table columns aligned successfully.');
  } catch (e) {
    console.error('✗ Failed to align "loyalty_transactions" table:', e.message);
  }

  // 3. Migrate Customers
  console.log('\n=== Step 3: Migrating Customers data ===');
  try {
    const custRes = await client.query(`
      INSERT INTO "customers" (
        "phone", "name", "email", "address", "whatsappOptIn", "group", "totalOrders", "totalSpent", "lastOrderDate", "lastMessageDate", "tags", "createdAt", "updatedAt"
      )
      SELECT 
        "phone", "name", "email", "address", "whatsappOptIn", "group", "totalOrders", "totalSpent", "lastOrderDate", "lastMessageDate", "tags", "createdAt", "updatedAt"
      FROM "Customer"
      ON CONFLICT ("phone") DO UPDATE 
      SET "name" = EXCLUDED."name",
          "email" = EXCLUDED."email",
          "address" = EXCLUDED."address",
          "whatsappOptIn" = EXCLUDED."whatsappOptIn",
          "group" = EXCLUDED."group",
          "totalOrders" = EXCLUDED."totalOrders",
          "totalSpent" = EXCLUDED."totalSpent",
          "lastOrderDate" = EXCLUDED."lastOrderDate",
          "lastMessageDate" = EXCLUDED."lastMessageDate",
          "tags" = EXCLUDED."tags",
          "updatedAt" = EXCLUDED."updatedAt"
    `);
    console.log(`✓ Customers migrated successfully. Rows affected: ${custRes.rowCount}`);
  } catch (e) {
    console.error('✗ Failed to migrate Customers:', e.message);
  }

  // 4. Migrate Loyalty Settings
  console.log('\n=== Step 4: Migrating Loyalty Settings data ===');
  try {
    const settingsRes = await client.query(`
      INSERT INTO "loyalty_settings" ("id", "pointsPerAmount", "amountThreshold", "updatedAt")
      SELECT "id", "pointsPerAmount", "amountThreshold", "updatedAt"
      FROM "LoyaltySetting"
      ON CONFLICT ("id") DO UPDATE
      SET "pointsPerAmount" = EXCLUDED."pointsPerAmount",
          "amountThreshold" = EXCLUDED."amountThreshold",
          "updatedAt" = EXCLUDED."updatedAt"
    `);
    console.log(`✓ Loyalty Settings migrated successfully. Rows affected: ${settingsRes.rowCount}`);
  } catch (e) {
    console.error('✗ Failed to migrate Loyalty Settings:', e.message);
  }

  // 5. Migrate Loyalty Transactions
  console.log('\n=== Step 5: Migrating Loyalty Transactions data ===');
  try {
    const txRes = await client.query(`
      INSERT INTO "loyalty_transactions" (
        "id", "phoneNumber", "orderId", "billId", "type", "points", "timestamp", "expiryDate", "isPending", "campaignId"
      )
      SELECT 
        "id", "phoneNumber", "orderId", "billId", "type", "points", "timestamp", "expiryDate", "isPending", "campaignId"
      FROM "LoyaltyTransaction"
      ON CONFLICT ("id") DO NOTHING
    `);
    console.log(`✓ Loyalty Transactions migrated successfully. Rows affected: ${txRes.rowCount}`);
  } catch (e) {
    console.error('✗ Failed to migrate Loyalty Transactions:', e.message);
  }

  console.log('\n=== Database Schema Alignment & Migration Completed Successfully! ===');
  await client.end();
}

main().catch(console.error);
