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
      variants: true,
      addOns: true
    }
  });

  console.log(`Checking match for ${items.length} items...`);
  
  let totalRelations = 0;
  let mismatchedRelations = 0;

  items.forEach(item => {
    if (item.addOns.length === 0) return;
    
    const variantNames = new Set(item.variants.map(v => v.name));
    
    item.addOns.forEach(ao => {
      if (!ao.variantName) return; // Global addon
      totalRelations++;
      
      if (!variantNames.has(ao.variantName)) {
        console.log(`Mismatch in "${item.name}" (${item.id}):`);
        console.log(`  - Addon variantName: "${ao.variantName}"`);
        console.log(`  - Item variants: [${Array.from(variantNames).map(n => `"${n}"`).join(', ')}]`);
        mismatchedRelations++;
      }
    });
  });

  console.log(`\nScan finished. Total variant-specific relations checked: ${totalRelations}`);
  console.log(`Mismatched relations (where addon variantName does not match any item variant name): ${mismatchedRelations}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
