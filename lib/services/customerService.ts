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
        where: { id: customerId },
        data: {
          totalOrders,
          totalSpent,
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
   * Run stats recalculation for ALL customers in the database.
   * Useful for migrations or fixing data corruptions.
   */
  static async recalculateAllCustomers() {
    console.log("[CustomerService] Starting global customer stats recalculation...");
    const customers = await prisma.customer.findMany({
      select: { id: true }
    });
    
    let count = 0;
    for (const customer of customers) {
      await this.recalculateCustomerStats(customer.id);
      count++;
    }
    console.log(`[CustomerService] Recalculated stats for ${count} customers.`);
    return count;
  }
}
