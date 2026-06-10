const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const res = await prisma.menuItem.findMany({
    where: { name: { contains: 'Chowmein', mode: 'insensitive' } },
    include: { variants: true }
  });
  console.log(JSON.stringify(res, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect().then(() => pool.end()));
