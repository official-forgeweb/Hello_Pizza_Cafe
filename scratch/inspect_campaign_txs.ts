import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');
  const campaignId = '244ba014-80c4-4eb0-9331-aea794a91005';

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });

  console.log("Campaign details:", campaign);

  const txsCount = await prisma.loyaltyTransaction.count({
    where: { campaignId: campaignId }
  });

  console.log(`Total LoyaltyTransactions for campaign ${campaignId}: ${txsCount}`);

  const sampleTxs = await prisma.loyaltyTransaction.findMany({
    where: { campaignId: campaignId },
    take: 5
  });

  console.log("Sample transactions:", sampleTxs);
}

main().catch(console.error);
