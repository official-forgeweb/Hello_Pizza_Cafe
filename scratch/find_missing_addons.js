require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not found!");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const items = await prisma.menuItem.findMany({
    include: {
      addOns: true
    }
  });

  console.log(`Scanning ${items.length} items for addon discrepancies...`);
  
  let discrepancyCount = 0;
  items.forEach(item => {
    const hasSmall = item.addOns.some(ao => ao.variantName === 'Small');
    const hasMedium = item.addOns.some(ao => ao.variantName === 'Medium');
    const hasLarge = item.addOns.some(ao => ao.variantName === 'Large');
    
    if (hasLarge && (!hasSmall || !hasMedium)) {
      console.log(`Discrepancy in item: "${item.name}" (${item.id})`);
      console.log(`  - Has Small: ${hasSmall}`);
      console.log(`  - Has Medium: ${hasMedium}`);
      console.log(`  - Has Large: ${hasLarge}`);
      discrepancyCount++;
    }
  });
  
  console.log(`\nScan finished. Found ${discrepancyCount} items with discrepancies.`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
