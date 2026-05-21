import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const settings = await prisma.restaurantSetting.findMany();
  console.log('RestaurantSettings in DB:', JSON.stringify(settings, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
