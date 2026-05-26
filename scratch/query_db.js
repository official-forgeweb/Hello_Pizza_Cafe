const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log('DATABASE_URL is:', connectionString ? 'Defined (length ' + connectionString.length + ')' : 'Undefined');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Hero Slides ---');
  const heroSlides = await prisma.heroSlide.findMany();
  for (const slide of heroSlides) {
    console.log(`ID: ${slide.id} | Title: "${slide.title}" | Tag: "${slide.tag}" | LinkUrl: "${slide.linkUrl}" | ImageUrl: "${slide.imageUrl}"`);
  }

  console.log('\n--- Menu Items (Paneer) ---');
  const paneerItems = await prisma.menuItem.findMany({
    where: {
      name: {
        contains: 'paneer',
        mode: 'insensitive'
      }
    }
  });
  for (const item of paneerItems) {
    console.log(`ID: ${item.id} | Name: "${item.name}" | ImageUrl: "${item.imageUrl}"`);
  }
}

main()
  .catch(err => console.error('Error running script:', err))
  .finally(() => prisma.$disconnect());
