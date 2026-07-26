import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { OrderNotificationService } = await import('../lib/services/orderNotificationService');
  const { default: prisma } = await import('../lib/prisma');

  const recentOrder = await prisma.order.findFirst({
    where: {
      customerPhone: '9310065542',
    },
    orderBy: { placedAt: 'desc' }
  });

  if (!recentOrder) {
    console.log("No order found for test phone");
    return;
  }

  console.log(`Testing WhatsApp receipt for order ${recentOrder.orderNumber} (ID: ${recentOrder.id}) to ${recentOrder.customerPhone}...`);

  // Temporarily reset waConfirmationSent to test
  await prisma.order.update({
    where: { id: recentOrder.id },
    data: { waConfirmationSent: false }
  });

  const res = await OrderNotificationService.sendPOSReceipt(recentOrder.id);
  console.log("WhatsApp Send Result:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
