import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.menuItem.count();
  console.log('Total menu items:', count);
  const items = await prisma.menuItem.findMany({ take: 5 });
  console.log(items.length, 'items fetched');
}

main().catch(console.error).finally(() => prisma.$disconnect());
