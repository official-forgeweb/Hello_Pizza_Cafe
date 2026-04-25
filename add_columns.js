const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.kxyaypvmgekxkwtkqnju:ndacadet002@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  try {
    await client.connect();
    
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE "MenuItemAddOn" 
      ADD COLUMN IF NOT EXISTS "addonGroup" TEXT NOT NULL DEFAULT 'Extras',
      ADD COLUMN IF NOT EXISTS "variantName" TEXT
    `);
    
    console.log('Columns added successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}
main();
