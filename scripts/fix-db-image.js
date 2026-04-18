const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const items = await prisma.menuItem.findMany({
    where: { imageUrl: { contains: '1590947132387' } }
  });
  console.log('Found ' + items.length + ' items in DB');
  for (const item of items) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=600&h=450' }
    });
    console.log('Fixed item:', item.name);
  }
}
fix().catch(console.error).finally(() => prisma.$disconnect());
