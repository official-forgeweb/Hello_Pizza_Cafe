import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

function getCampaignExpiryDate(campaign: any): Date {
  if (Array.isArray(campaign.bodyParameters)) {
    for (const param of campaign.bodyParameters) {
      const cleanParam = String(param).replace(/[{}]/g, '').trim();
      const ddmmyyyy = cleanParam.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (ddmmyyyy) {
        const day = parseInt(ddmmyyyy[1], 10);
        const month = parseInt(ddmmyyyy[2], 10) - 1;
        const year = parseInt(ddmmyyyy[3], 10);
        const parsed = new Date(year, month, day, 23, 59, 59, 999);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');

  // 1. Fix existing bonus transactions created for campaign "loyalty admin24july" (76ee60fd-4bf0-4555-8595-2f9df147182a)
  const campaign = await prisma.campaign.findUnique({
    where: { id: '76ee60fd-4bf0-4555-8595-2f9df147182a' }
  });

  if (campaign) {
    const expDate = getCampaignExpiryDate(campaign);
    console.log("Campaign 76ee60fd parsed expiry date:", expDate.toISOString());

    const updateRes = await prisma.loyaltyTransaction.updateMany({
      where: { campaignId: campaign.id },
      data: { expiryDate: expDate }
    });
    console.log(`Updated ${updateRes.count} transaction(s) for campaign ${campaign.id} to expiryDate: ${expDate.toISOString()}`);
  }

  // 2. Also fix any other campaigns that have DD-MM-YYYY in bodyParameters
  const allCampaigns = await prisma.campaign.findMany();
  for (const c of allCampaigns) {
    if (Array.isArray(c.bodyParameters) && c.bodyParameters.length > 0) {
      const expDate = getCampaignExpiryDate(c);
      // check if it was parsed from body parameters (not default 30-day fallback)
      const hasDateParam = c.bodyParameters.some(p => /\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(String(p)));
      if (hasDateParam) {
        const res = await prisma.loyaltyTransaction.updateMany({
          where: { campaignId: c.id },
          data: { expiryDate: expDate }
        });
        if (res.count > 0) {
          console.log(`Updated ${res.count} tx(s) for campaign "${c.name}" to expiryDate: ${expDate.toISOString()}`);
        }
      }
    }
  }

  // Now calculate wallet using Chronological FIFO for Sunil Baghel (9310065542)
  const phone = '9310065542';
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const txs = await prisma.loyaltyTransaction.findMany({
    where: { phoneNumber: phone },
    orderBy: { timestamp: 'asc' }
  });

  interface Batch {
    id: string;
    type: string;
    points: number;
    timestamp: Date;
    expiryDate: Date | null;
  }

  const activeBatches: Batch[] = [];

  txs.forEach(tx => {
    if (tx.points > 0) {
      activeBatches.push({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        timestamp: new Date(tx.timestamp),
        expiryDate: tx.expiryDate ? new Date(tx.expiryDate) : null
      });
    } else if (tx.points < 0) {
      let needed = Math.abs(tx.points);
      const redeemTime = new Date(tx.timestamp);

      for (const batch of activeBatches) {
        if (needed <= 0) break;
        if (batch.points <= 0) continue;

        if (batch.expiryDate && batch.expiryDate <= redeemTime) {
          continue;
        }

        const deduct = Math.min(batch.points, needed);
        batch.points -= deduct;
        needed -= deduct;
      }
    }
  });

  let availablePoints = 0;
  let pendingPoints = 0;

  activeBatches.forEach(batch => {
    if (batch.points <= 0) return;

    const isPending = batch.type === 'EARN' && batch.timestamp > oneDayAgo;
    const isExpired = batch.expiryDate && batch.expiryDate <= now;

    if (isPending) {
      pendingPoints += batch.points;
    } else if (!isExpired) {
      availablePoints += batch.points;
    }
  });

  console.log("FIXED WALLET FOR 9310065542:", { availablePoints, pendingPoints });
}

main().catch(console.error);
