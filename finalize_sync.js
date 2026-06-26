const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL not found in .env file!');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL database...');
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  console.log('\n=== Step 1: Migrating Customers to unified lowercase table ===');
  try {
    const customerRes = await pool.query(`
      INSERT INTO "customers" ("phone", "name", "email", "address", "created_at", "updated_at")
      SELECT "phone", "name", "email", "address", "createdAt", "updatedAt"
      FROM "Customer"
      ON CONFLICT ("phone") DO UPDATE 
      SET "name" = EXCLUDED."name",
          "email" = EXCLUDED."email",
          "address" = EXCLUDED."address",
          "updated_at" = EXCLUDED."updated_at"
    `);
    console.log(`✓ Customers migrated successfully. Rows affected: ${customerRes.rowCount}`);
  } catch (e) {
    console.error('✗ Failed to migrate Customers:', e.message);
  }

  console.log('\n=== Step 2: Migrating Loyalty Settings to unified lowercase table ===');
  try {
    const settingsRes = await pool.query(`
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

  console.log('\n=== Step 3: Migrating Loyalty Transactions to unified lowercase table ===');
  try {
    const txRes = await pool.query(`
      INSERT INTO "loyalty_transactions" (
        "id", "phoneNumber", "orderId", "billId", "type", "points", "timestamp", "expiryDate", "isPending", "campaignId"
      )
      SELECT 
        "id", "phoneNumber", "orderId", "billId", "type", "points", "timestamp", "expiryDate", "isPending"::int, "campaignId"
      FROM "LoyaltyTransaction"
      ON CONFLICT ("id") DO NOTHING
    `);
    console.log(`✓ Loyalty Transactions migrated successfully. Rows affected: ${txRes.rowCount}`);
  } catch (e) {
    console.error('✗ Failed to migrate Loyalty Transactions:', e.message);
  }

  console.log('\n=== Migration Complete ===');
  await pool.end();
}

main().catch(console.error);
