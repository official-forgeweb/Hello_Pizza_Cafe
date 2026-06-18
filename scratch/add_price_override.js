require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  // Use DIRECT_URL for schema changes (bypasses Supabase pooler)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Connecting to add priceOverride column...');
  
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    // Check if column already exists
    const check = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'MenuItemAddOn' AND column_name = 'priceOverride'
    `);
    
    if (check.rows.length > 0) {
      console.log('Column "priceOverride" already exists. Nothing to do.');
    } else {
      await pool.query(`ALTER TABLE "MenuItemAddOn" ADD COLUMN "priceOverride" DECIMAL(10, 2)`);
      console.log('✅ Column "priceOverride" added successfully to MenuItemAddOn table.');
    }
    
    // Verify
    const verify = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'MenuItemAddOn'
      ORDER BY ordinal_position
    `);
    console.log('\nMenuItemAddOn columns:');
    verify.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
