require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not found in environment!");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const items = await prisma.menuItem.findMany({
    where: {
      name: {
        contains: 'Pizza',
        mode: 'insensitive'
      }
    },
    include: {
      variants: true,
      addOns: true
    }
  });

  console.log(`Found ${items.length} Pizza items:`);
  
  items.forEach(item => {
    if (item.variants.length > 0) {
      console.log(`\nItem: ${item.name} (${item.id})`);
      console.log('  Variants in DB:', item.variants.map(v => `${v.name} (Modifier: ${v.priceModifier})`));
      
      const addonGroupToVariants = {};
      item.addOns.forEach(ao => {
        if (!addonGroupToVariants[ao.addonGroup]) {
          addonGroupToVariants[ao.addonGroup] = new Set();
        }
        addonGroupToVariants[ao.addonGroup].add(ao.variantName);
      });
      
      console.log('  Addon Groups & Linked Variant Names:');
      Object.entries(addonGroupToVariants).forEach(([group, vars]) => {
        console.log(`    - ${group}: [${Array.from(vars).join(', ')}]`);
      });
    }
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
