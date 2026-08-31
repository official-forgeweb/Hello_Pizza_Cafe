const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  require('dotenv').config();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('=== Updating Happy Hours Category Schedule in Web Database ===\n');

  const updated = await prisma.category.update({
    where: { id: "82d7e45d-8a18-426a-b6f8-9ad7e9c5b813" },
    data: {
      applicableDays: "[1,2,3,4,5]",
      startTime: "10:00",
      endTime: "13:00",
      timeSlots: JSON.stringify([
        { start: "10:00", end: "13:00" },
        { start: "16:00", end: "18:00" }
      ])
    }
  });

  console.log('Updated category:', JSON.stringify(updated, null, 2));

  const cat = await prisma.category.findMany({
    where: {
      OR: [
        { id: '82d7e45d-8a18-426a-b6f8-9ad7e9c5b813' },
        { name: { contains: 'happy', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Found web categories:', JSON.stringify(cat, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
