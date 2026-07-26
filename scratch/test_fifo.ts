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

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Chronological FIFO ledger processing
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

        // A redemption can only consume points from a batch if that batch hadn't expired yet at the time of redemption
        // (or if redemption consumes from active unexpired batches in FIFO order)
        if (batch.expiryDate && batch.expiryDate <= redeemTime) {
          continue; // expired before this redemption happened
        }

        const deduct = Math.min(batch.points, needed);
        batch.points -= deduct;
        needed -= deduct;
      }
    }
  });

  let availablePoints = 0;
  let pendingPoints = 0;
  let earliestExpiry: Date | null = null;

  activeBatches.forEach(batch => {
    if (batch.points <= 0) return;

    const isPending = batch.type === 'EARN' && batch.timestamp > oneDayAgo;
    const isExpired = batch.expiryDate && batch.expiryDate <= now;

    if (isPending) {
      pendingPoints += batch.points;
    } else if (!isExpired) {
      availablePoints += batch.points;
      if (batch.expiryDate) {
        if (!earliestExpiry || batch.expiryDate < earliestExpiry) {
          earliestExpiry = batch.expiryDate;
        }
      }
    }
  });

  console.log("CHRONOLOGICAL FIFO RESULT:", {
    availablePoints,
    pendingPoints,
    nextExpiryDate: earliestExpiry,
    remainingBatches: activeBatches.filter(b => b.points > 0)
  });
}

main().catch(console.error);
