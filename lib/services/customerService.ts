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

    // --- 1. Calculate actual available points ---
    const availableList: { points: number; expiryDate: Date | null }[] = [];
    let redeemedTotal = 0;

    txs.forEach(tx => {
      if (tx.points > 0) {
        const isPending = tx.type === 'EARN' && tx.timestamp > oneDayAgo;
        const isExpired = tx.expiryDate && tx.expiryDate <= now;
        
        if (!isPending && !isExpired) {
          availableList.push({ points: tx.points, expiryDate: tx.expiryDate });
        }
      } else {
        redeemedTotal += Math.abs(tx.points);
      }
    });

    let availPoints = 0;
    availableList.forEach(item => {
      if (redeemedTotal >= item.points) {
        redeemedTotal -= item.points;
        item.points = 0;
      } else {
        item.points -= redeemedTotal;
        redeemedTotal = 0;
        availPoints += item.points;
      }
    });

    // --- 2. Calculate tier points (with 10-day relaxation grace period for redemptions and expirations) ---
    const tierAvailableList: { points: number; expiryDate: Date | null }[] = [];
    let tierRedeemedTotal = 0;

    txs.forEach(tx => {
      if (tx.points > 0) {
        const isPending = tx.type === 'EARN' && tx.timestamp > oneDayAgo;
        // Points that expired in the last 10 days are treated as not expired for tier calculation
        const isExpiredForTier = tx.expiryDate && tx.expiryDate <= tenDaysAgo;
        
        if (!isPending && !isExpiredForTier) {
          tierAvailableList.push({ points: tx.points, expiryDate: tx.expiryDate });
        }
      } else {
        // Redemptions in the last 10 days are ignored (added back) for tier calculation
        const isRedemptionInLast10Days = tx.timestamp > tenDaysAgo;
        if (!isRedemptionInLast10Days) {
          tierRedeemedTotal += Math.abs(tx.points);
        }
      }
    });

    let tierPoints = 0;
    tierAvailableList.forEach(item => {
      if (tierRedeemedTotal >= item.points) {
        tierRedeemedTotal -= item.points;
        item.points = 0;
      } else {
        item.points -= tierRedeemedTotal;
        tierRedeemedTotal = 0;
        tierPoints += item.points;
      }
    });

    // --- 3. Calculate pending points ---
    let pendingPoints = 0;
    txs.forEach(tx => {
      if (tx.points > 0 && tx.type === 'EARN' && tx.timestamp > oneDayAgo && (!tx.expiryDate || tx.expiryDate > now)) {
        pendingPoints += tx.points;
      }
    });

    let earliestExpiry: Date | null = null;
    availableList.forEach(item => {
      if (item.points > 0 && item.expiryDate) {
        if (!earliestExpiry || item.expiryDate < earliestExpiry) {
          earliestExpiry = item.expiryDate;
        }
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

    const availableList: { points: number; expiryDate: Date }[] = [];
    let redeemedTotal = 0;

    txs.forEach(tx => {
      if (tx.points > 0) {
        const isPending = tx.type === 'EARN' && tx.timestamp > oneDayAgo;
        const isExpired = tx.expiryDate && tx.expiryDate <= now;
        
        if (!isPending && !isExpired && tx.expiryDate) {
          availableList.push({ points: tx.points, expiryDate: tx.expiryDate });
        }
      } else {
        redeemedTotal += Math.abs(tx.points);
      }
    });

    availableList.forEach(item => {
      if (redeemedTotal >= item.points) {
        redeemedTotal -= item.points;
        item.points = 0;
      } else {
        item.points -= redeemedTotal;
        redeemedTotal = 0;
      }
    });

    return availableList.filter(item => item.points > 0);
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
