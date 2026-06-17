require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in environment!");
    return;
  }
  
  console.log("Connecting to Database...");
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Querying SplashAd table...");
    const ads = await prisma.splashAd.findMany({
      orderBy: { displayOrder: "asc" },
    });
    console.log("Query successful! Found ads:", ads);
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
