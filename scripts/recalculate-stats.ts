import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting global customer stats recalculation...");
  const customers = await prisma.customer.findMany({
    select: { name: true, phone: true }
  });
  
  console.log(`Found ${customers.length} customers. Recalculating stats...`);
  
  let count = 0;
  for (const customer of customers) {
    try {
      // Fetch all orders for this customer that are not CANCELLED
      const orders = await prisma.order.findMany({
        where: {
          customerId: customer.phone,
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
        where: { customerId: customer.phone },
        select: { placedAt: true },
        orderBy: { placedAt: "desc" },
        take: 1
      });
      const lastOrderDate = allOrders[0]?.placedAt || null;

      // Group: VIP if totalOrders >= 5, regular if >= 2, otherwise new
      const group = totalOrders >= 5 ? "vip" : totalOrders >= 2 ? "regular" : "new";

      await prisma.customer.update({
        where: { phone: customer.phone },
        data: {
          totalOrders,
          totalSpent,
          lastOrderDate,
          group
        }
      });
      
      console.log(`[${count + 1}/${customers.length}] Recalculated stats for ${customer.name} (${customer.phone}): orders=${totalOrders}, spent=₹${totalSpent}, group=${group}`);
      count++;
    } catch (err) {
      console.error(`Error recalculating stats for customer ${customer.phone}:`, err);
    }
  }
  
  console.log(`Finished recalculating stats for ${count} customers.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
