import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');

  const orderTxs = await prisma.loyaltyTransaction.findMany({
    where: {
      orderId: { not: null }
    },
    take: 20,
    orderBy: { timestamp: 'desc' }
  });

  console.log(`Found ${orderTxs.length} LoyaltyTransactions linked to orderId:`);
  orderTxs.forEach(t => {
    console.log({
      id: t.id,
      phone: t.phoneNumber,
      orderId: t.orderId,
      billId: t.billId,
      type: t.type,
      points: t.points,
      timestamp: t.timestamp,
      isPending: t.isPending
    });
  });
}

main().catch(console.error);
