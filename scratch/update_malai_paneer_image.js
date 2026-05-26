const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not defined!");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating Malai Paneer Makhani...');
  const updated = await prisma.menuItem.updateMany({
    where: {
      name: {
        equals: 'Malai Paneer Makhani',
        mode: 'insensitive'
      }
    },
    data: {
      imageUrl: 'https://media.darpanmagazine.com/library/uploads/food/content/paneerpizza.jpg'
    }
  });

  console.log(`Updated ${updated.count} items.`);

  const items = await prisma.menuItem.findMany({
    where: {
      name: {
        equals: 'Malai Paneer Makhani',
        mode: 'insensitive'
      }
    }
  });

  for (const item of items) {
    console.log(`Verified Item: ID=${item.id}, Name="${item.name}", ImageUrl="${item.imageUrl}"`);
  }
}

main()
  .catch(err => console.error('Error:', err))
  .finally(() => prisma.$disconnect());
