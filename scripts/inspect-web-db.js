const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  require('dotenv').config();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log('=== Web Database Item Inspection Complete ===\n');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
