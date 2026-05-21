const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.restaurantSetting.findMany();
  console.log('RestaurantSettings in DB:', JSON.stringify(settings, null, 2));
}

main().finally(() => prisma.$disconnect());
