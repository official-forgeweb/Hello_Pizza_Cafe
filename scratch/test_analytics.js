require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("=== Testing WhatsApp Analytics Query ===");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSentToday,
      totalDeliveredToday,
      totalFailedToday,
      allLogsToday
    ] = await Promise.all([
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: { in: ['sent', 'delivered', 'read'] } }
      }),
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: { in: ['delivered', 'read'] } }
      }),
      prisma.messageLog.count({
        where: { createdAt: { gte: today }, status: 'failed' }
      }),
      prisma.messageLog.findMany({
        where: { createdAt: { gte: today } }
      })
    ]);

    console.log(`\nToday's Date: ${today.toDateString()}`);
    console.log(`Total Message Logs Created Today: ${allLogsToday.length}`);
    console.log(`-------------------------------------------`);
    console.log(`Messages Sent Today (Sent/Delivered/Read): ${totalSentToday}`);
    console.log(`Messages Delivered Today (Delivered/Read): ${totalDeliveredToday}`);
    console.log(`Messages Failed Today:                    ${totalFailedToday}`);

    // Print breakdown
    const statusCounts = {};
    for (const log of allLogsToday) {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
    }
    console.log(`\nStatus breakdown of today's messages:`, statusCounts);

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
