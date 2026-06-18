require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Check Capsicum Pizza specifically
  const item = await prisma.menuItem.findFirst({
    where: { name: { contains: 'Capsicum Pizza', mode: 'insensitive' } },
    include: {
      variants: true,
      addOns: { include: { addOn: true } }
    }
  });

  if (!item) {
    console.log('Capsicum Pizza not found');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`Item: "${item.name}" (${item.id})`);
  console.log(`\nVariants:`);
  item.variants.forEach(v => console.log(`  ${v.name}: ₹${v.priceModifier}`));

  console.log(`\nSmall addons from website DB:`);
  const smallAddons = item.addOns.filter(a => a.variantName === 'Small');
  smallAddons.forEach(ao => {
    console.log(`  ${ao.addOn.name}: ₹${ao.addOn.price} (addon ID: ${ao.addOnId}, addonGroup: ${ao.addonGroup})`);
  });

  // Now check: how many AddOn records exist with name "Paneer"?
  const paneerAddons = await prisma.addOn.findMany({
    where: { name: { contains: 'Paneer', mode: 'insensitive' } }
  });
  console.log(`\nAll "Paneer" AddOn records in website DB:`);
  paneerAddons.forEach(a => console.log(`  id: ${a.id}, name: "${a.name}", price: ₹${a.price}`));

  // Check "Mushroom" too
  const mushroomAddons = await prisma.addOn.findMany({
    where: { name: 'Mushroom' }
  });
  console.log(`\nAll "Mushroom" AddOn records in website DB:`);
  mushroomAddons.forEach(a => console.log(`  id: ${a.id}, name: "${a.name}", price: ₹${a.price}`));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
