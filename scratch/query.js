require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.menuItem.findMany({
    where: {
      OR: [
        { name: { contains: 'Pizza', mode: 'insensitive' } },
        { category: { name: { contains: 'Pizza', mode: 'insensitive' } } }
      ]
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      category: {
        select: {
          name: true
        }
      }
    },
    take: 20
  });

  console.log('--- Pizza Images in DB ---');
  items.forEach(item => {
    console.log(`Item: "${item.name}" (Category: "${item.category?.name}")`);
    console.log(`  Image: ${item.imageUrl}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => pool.end()));
