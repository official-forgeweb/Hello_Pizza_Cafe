import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');

  const result = await prisma.loyaltyTransaction.deleteMany({
    where: {
      orderId: { not: null },
      billId: null
    }
  });

  console.log(`Deleted ${result.count} premature LoyaltyTransactions (where orderId is set but billId is null).`);
}

main().catch(console.error);
