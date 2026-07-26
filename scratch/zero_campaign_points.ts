import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');
  const campaignId = '244ba014-80c4-4eb0-9331-aea794a91005';

  // 1. Update Campaign bonusPoints to 0
  const campaignUpdate = await prisma.campaign.update({
    where: { id: campaignId },
    data: { bonusPoints: 0 }
  });
  console.log(`Updated Campaign "${campaignUpdate.name}" (${campaignId}) bonusPoints to: ${campaignUpdate.bonusPoints}`);

  // 2. Update all LoyaltyTransactions for this campaign to points = 0
  const pastDate = new Date('2026-07-24T00:00:00.000Z');
  const txUpdate = await prisma.loyaltyTransaction.updateMany({
    where: { campaignId: campaignId },
    data: {
      points: 0,
      expiryDate: pastDate
    }
  });
  console.log(`Updated ${txUpdate.count} LoyaltyTransactions for campaign "${campaignUpdate.name}" to points = 0 and expired.`);
}

main().catch(console.error);
