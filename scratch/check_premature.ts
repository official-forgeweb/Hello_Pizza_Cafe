import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');

  const prematureTxs = await prisma.loyaltyTransaction.findMany({
    where: {
      orderId: { not: null },
      billId: null
    }
  });

  console.log(`Found ${prematureTxs.length} premature LoyaltyTransactions with orderId set and billId null.`);
  prematureTxs.forEach(t => {
    console.log({
      id: t.id,
      phone: t.phoneNumber,
      orderId: t.orderId,
      type: t.type,
      points: t.points,
      timestamp: t.timestamp
    });
  });
}

main().catch(console.error);
