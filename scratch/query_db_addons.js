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

  const addons = await prisma.menuItemAddOn.findMany({
    include: {
      addOn: true,
      menuItem: true
    }
  });

  console.log(`Found ${addons.length} MenuItemAddOn relations:`);
  
  const groups = new Set();
  const sampleRelations = [];

  for (const a of addons) {
    groups.add(a.addonGroup);
    if (sampleRelations.length < 30) {
      sampleRelations.push({
        item: a.menuItem.name,
        addon: a.addOn.name,
        relationAddonGroup: a.addonGroup,
        addonTableAddonGroup: a.addOn.addonGroup,
        variantName: a.variantName
      });
    }
  }

  console.log('\nUnique addonGroup values in MenuItemAddOn table:');
  console.log(Array.from(groups));
  
  console.log('\nSamples:');
  console.log(JSON.stringify(sampleRelations, null, 2));
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => console.error(e));
