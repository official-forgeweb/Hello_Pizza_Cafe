require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true,
      basePrice: true,
      isAvailable: true,
    }
  });

  const nameMap = {};
  items.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (!nameMap[key]) {
      nameMap[key] = [];
    }
    nameMap[key].push(item);
  });

  console.log('Starting cleanup...');
  let deactivatedCount = 0;
  let deletedCount = 0;

  for (const name in nameMap) {
    const list = nameMap[name];
    if (list.length > 1) {
      // Find the one with the maximum price
      let maxItem = list[0];
      list.forEach(item => {
        if (Number(item.basePrice) > Number(maxItem.basePrice)) {
          maxItem = item;
        }
      });

      console.log(`De-duplicating item "${maxItem.name}" (keeping ID: ${maxItem.id}, price: ${maxItem.basePrice})`);

      // Deactivate/Delete the others
      for (const item of list) {
        if (item.id === maxItem.id) continue;

        // Try to delete physically
        try {
          // Delete variant and addon link files first
          await prisma.itemVariant.deleteMany({ where: { menuItemId: item.id } });
          await prisma.menuItemAddOn.deleteMany({ where: { menuItemId: item.id } });
          await prisma.menuItem.delete({ where: { id: item.id } });
          console.log(`  Physically deleted duplicate item ID: ${item.id}`);
          deletedCount++;
        } catch (err) {
          // If referencing order history, set isAvailable = false
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { isAvailable: false }
          });
          console.log(`  Set isAvailable = false for duplicate item ID: ${item.id} (due to foreign key references)`);
          deactivatedCount++;
        }
      }
    }
  }

  console.log(`Cleanup finished. Deleted: ${deletedCount}, Deactivated: ${deactivatedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => pool.end()));
