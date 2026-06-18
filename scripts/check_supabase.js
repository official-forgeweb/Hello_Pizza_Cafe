const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("--- SUPABASE LATEST SYNCED ORDERS ---");
  const orders = await prisma.order.findMany({
    orderBy: { placedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      totalAmount: true,
      status: true,
      placedAt: true,
      waConfirmationSent: true,
      isSynced: true
    }
  });
  console.log(JSON.stringify(orders, null, 2));

  console.log("--- SUPABASE LATEST CLOUD SYNC QUEUE ---");
  const syncQueue = await prisma.cloudSyncQueue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log(JSON.stringify(syncQueue, null, 2));

  console.log("--- SUPABASE LATEST MESSAGE LOGS ---");
  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(logs, null, 2));

  await prisma.$disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
