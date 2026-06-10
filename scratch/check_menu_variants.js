const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.menuItem.findMany({
    include: {
      category: true,
      variants: true
    }
  });
  
  console.log(`Total Menu Items: ${items.length}`);
  
  // Group by name to see duplicates
  const grouped = {};
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  
  console.log('\n--- Duplicated Names ---');
  for (const [name, list] of Object.entries(grouped)) {
    if (list.length > 1) {
      console.log(`Name: "${list[0].name}" | Category: "${list[0].category.name}" | Count: ${list.length}`);
      for (const item of list) {
        console.log(`  - ID: ${item.id} | BasePrice: ${item.basePrice} | Available: ${item.isAvailable} | Variants: ${item.variants.map(v => `${v.name}(+${v.priceModifier})`).join(', ')}`);
      }
    }
  }

  console.log('\n--- Chowmein / Pasta Items ---');
  for (const item of items) {
    if (item.name.toLowerCase().includes('chow') || item.name.toLowerCase().includes('pasta')) {
      console.log(`Name: "${item.name}" | Category: "${item.category.name}"`);
      console.log(`  - ID: ${item.id} | BasePrice: ${item.basePrice} | Available: ${item.isAvailable}`);
      if (item.variants.length > 0) {
        console.log(`  - Variants:`);
        for (const v of item.variants) {
          console.log(`    * ${v.name} (ID: ${v.id}) | Modifier: ${v.priceModifier} | Default: ${v.isDefault}`);
        }
      } else {
        console.log(`  - No variants`);
      }
    }
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
