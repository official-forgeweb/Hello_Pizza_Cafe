const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.menuItem.findMany({
    where: { name: { contains: 'Malai Paneer' } }
  });
  console.log('MenuItems:', items);

  const slides = await prisma.heroSlide.findMany({
    where: { title: { contains: 'Malai Paneer' } }
  });
  console.log('HeroSlides:', slides);
}

main().finally(() => prisma.$disconnect());
