import prisma from "@/lib/prisma";

export class CustomerService {
  /**
   * Recalculates and updates the denormalized statistics for a customer
   * based on their actual orders in the database.
   */
  static async recalculateCustomerStats(customerId: string) {
    try {
      // Fetch all orders for this customer that are not CANCELLED
      const orders = await prisma.order.findMany({
        where: {
          customerId,
          status: { not: "CANCELLED" }
        },
        select: {
          totalAmount: true,
          placedAt: true
        }
      });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // Find the latest order date
      const allOrders = await prisma.order.findMany({
        where: { customerId },
        select: { placedAt: true },
        orderBy: { placedAt: "desc" },
        take: 1
      });
      const lastOrderDate = allOrders[0]?.placedAt || null;

      // Group: VIP if totalOrders >= 5, regular if >= 2, otherwise new
      const group = totalOrders >= 5 ? "vip" : totalOrders >= 2 ? "regular" : "new";

      await prisma.customer.update({
        where: { phone: customerId },
        data: {
          totalOrders,
          totalSpent: totalSpent,
          lastOrderDate,
          group
        }
      });
      
      console.log(`[CustomerService] Recalculated stats for customer ${customerId}: orders=${totalOrders}, spent=₹${totalSpent}, group=${group}`);
    } catch (error) {
      console.error(`[CustomerService] Error recalculating stats for customer ${customerId}:`, error);
    }
  }

  /**
   * Calculates the loyalty wallet balance (Available and Pending points)
   * for a customer based on their transaction history in the database.
   */
  static async getCustomerLoyaltyWallet(phone: string) {
    if (!phone) return { availablePoints: 0, pendingPoints: 0, nextExpiryDate: null, tierPoints: 0 };

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const txs = await prisma.loyaltyTransaction.findMany({
      where: { phoneNumber: phone },
      orderBy: { timestamp: "asc" }
    });

    interface Batch {
      id: string;
      type: string;
      points: number;
      timestamp: Date;
      expiryDate: Date | null;
    }

    // --- 1. Calculate actual available points (Chronological FIFO ledger) ---
    const activeBatches: Batch[] = [];

    txs.forEach(tx => {
      if (tx.points > 0) {
        activeBatches.push({
          id: tx.id,
          type: tx.type,
          points: tx.points,
          timestamp: new Date(tx.timestamp),
          expiryDate: tx.expiryDate ? new Date(tx.expiryDate) : new Date(new Date(tx.timestamp).getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      } else if (tx.points < 0) {
        let needed = Math.abs(tx.points);
        const redeemTime = new Date(tx.timestamp);

        for (const batch of activeBatches) {
          if (needed <= 0) break;
          if (batch.points <= 0) continue;

          // A redemption cannot consume points from a batch if that batch had already expired at the time of redemption
          if (batch.expiryDate && batch.expiryDate <= redeemTime) {
            continue;
          }

          const deduct = Math.min(batch.points, needed);
          batch.points -= deduct;
          needed -= deduct;
        }
      }
    });

    let availPoints = 0;
    let pendingPoints = 0;
    let earliestExpiry: Date | null = null;

    activeBatches.forEach(batch => {
      if (batch.points <= 0) return;

      const isPending = batch.type === 'EARN' && batch.timestamp > oneDayAgo;
      const isExpired = batch.expiryDate 
        ? (batch.expiryDate <= now) 
        : (batch.timestamp.getTime() <= (now.getTime() - 30 * 24 * 60 * 60 * 1000));

      if (isPending) {
        pendingPoints += batch.points;
      } else if (!isExpired) {
        availPoints += batch.points;
        if (batch.expiryDate) {
          if (!earliestExpiry || batch.expiryDate < earliestExpiry) {
            earliestExpiry = batch.expiryDate;
          }
        }
      }
    });

    // --- 2. Calculate tier points (with 10-day relaxation grace period for redemptions and expirations) ---
    const tierBatches: Batch[] = [];

    txs.forEach(tx => {
      if (tx.points > 0) {
        tierBatches.push({
          id: tx.id,
          type: tx.type,
          points: tx.points,
          timestamp: new Date(tx.timestamp),
          expiryDate: tx.expiryDate ? new Date(tx.expiryDate) : new Date(new Date(tx.timestamp).getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      } else if (tx.points < 0) {
        const isRedemptionInLast10Days = new Date(tx.timestamp) > tenDaysAgo;
        if (!isRedemptionInLast10Days) {
          let needed = Math.abs(tx.points);
          const redeemTime = new Date(tx.timestamp);

          for (const batch of tierBatches) {
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
      }
    });

    let tierPoints = 0;
    tierBatches.forEach(batch => {
      if (batch.points <= 0) return;

      const isPending = batch.type === 'EARN' && batch.timestamp > oneDayAgo;
      const isExpiredForTier = batch.expiryDate 
        ? (batch.expiryDate <= tenDaysAgo) 
        : (batch.timestamp.getTime() <= (tenDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000));

      if (!isPending && !isExpiredForTier) {
        tierPoints += batch.points;
      }
    });

    return {
      availablePoints: availPoints,
      pendingPoints,
      nextExpiryDate: earliestExpiry,
      tierPoints
    };
  }

  static async getAvailablePointsBatches(phone: string) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const txs = await prisma.loyaltyTransaction.findMany({
      where: { phoneNumber: phone },
      orderBy: { timestamp: "asc" }
    });

    interface Batch {
      id: string;
      type: string;
      points: number;
      timestamp: Date;
      expiryDate: Date;
    }

    const activeBatches: Batch[] = [];

    txs.forEach(tx => {
      if (tx.points > 0) {
        activeBatches.push({
          id: tx.id,
          type: tx.type,
          points: tx.points,
          timestamp: new Date(tx.timestamp),
          expiryDate: tx.expiryDate ? new Date(tx.expiryDate) : new Date(new Date(tx.timestamp).getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      } else if (tx.points < 0) {
        let needed = Math.abs(tx.points);
        const redeemTime = new Date(tx.timestamp);

        for (const batch of activeBatches) {
          if (needed <= 0) break;
          if (batch.points <= 0) continue;

          if (batch.expiryDate <= redeemTime) {
            continue;
          }

          const deduct = Math.min(batch.points, needed);
          batch.points -= deduct;
          needed -= deduct;
        }
      }
    });

    return activeBatches.filter(batch => {
      if (batch.points <= 0) return false;
      const isPending = batch.type === 'EARN' && batch.timestamp > oneDayAgo;
      const isExpired = batch.expiryDate <= now;
      return !isPending && !isExpired;
    });
  }

  static async getPointsExpiringInDays(phone: string, days: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toDateString();
    
    const batches = await this.getAvailablePointsBatches(phone);
    return batches
      .filter(b => b.expiryDate.toDateString() === targetDateStr)
      .reduce((sum, b) => sum + b.points, 0);
  }


  /**
   * Run stats recalculation for ALL customers in the database.
   * Useful for migrations or fixing data corruptions.
   */
  static async recalculateAllCustomers() {
    console.log("[CustomerService] Starting global customer stats recalculation...");
    const customers = await prisma.customer.findMany({
      select: { phone: true }
    });
    
    let count = 0;
    for (const customer of customers) {
      await this.recalculateCustomerStats(customer.phone);
      count++;
    }
    console.log(`[CustomerService] Recalculated stats for ${count} customers.`);
    return count;
  }
}
