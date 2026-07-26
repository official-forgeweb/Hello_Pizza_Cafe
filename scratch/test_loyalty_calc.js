const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.loyaltyTransaction.findMany({
    where: { phoneNumber: '9310065542' },
    orderBy: { timestamp: 'asc' }
  });
  console.log("Transactions count:", txs.length);
  txs.forEach(t => {
    console.log({
      id: t.id,
      type: t.type,
      points: t.points,
      timestamp: t.timestamp,
      expiryDate: t.expiryDate
    });
  });
}

main().finally(() => prisma.$disconnect());
