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

  const item = await prisma.menuItem.findFirst({
    where: {
      name: {
        contains: 'Veg Crispy Popcorn',
        mode: 'insensitive'
      }
    },
    include: {
      variants: true,
      addOns: {
        include: {
          addOn: true
        }
      }
    }
  });

  if (!item) {
    console.log('Veg Crispy Popcorn Pizza not found in website DB.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`Item: "${item.name}" (${item.id})`);
  console.log(`Variants in Website DB (${item.variants.length}):`);
  item.variants.forEach(v => {
    console.log(`  - name: "${v.name}", id: "${v.id}", priceModifier: ${v.priceModifier}`);
  });

  console.log(`Addon relations in Website DB (${item.addOns.length}):`);
  item.addOns.forEach(ao => {
    console.log(`  - addon: "${ao.addOn.name}", addonGroup: "${ao.addonGroup}", variantName: "${ao.variantName}"`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
