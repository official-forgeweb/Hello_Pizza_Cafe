import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');
  const txs = await prisma.loyaltyTransaction.findMany({
    where: { phoneNumber: '9310065542' },
    orderBy: { timestamp: 'asc' }
  });
  console.log("All transactions for 9310065542:");
  txs.forEach(tx => {
    console.log({
      id: tx.id,
      type: tx.type,
      points: tx.points,
      timestamp: tx.timestamp.toISOString(),
      expiryDate: tx.expiryDate ? tx.expiryDate.toISOString() : null
    });
  });
}

main().catch(console.error);
