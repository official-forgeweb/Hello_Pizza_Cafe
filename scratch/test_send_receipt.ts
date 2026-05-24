import prisma from '../lib/prisma';
import { OrderNotificationService } from '../lib/services/orderNotificationService';

async function test() {
  console.log('Finding a recent order to test with...');
  
  // Find a recent order
  const testOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!testOrder) {
    console.error('No orders found in the database. Please place or sync an order first.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Using order: ${testOrder.id} (${testOrder.orderNumber}) with total amount: ${testOrder.totalAmount} and phone: ${testOrder.customerPhone}`);

  // Temporarily reset waConfirmationSent to test
  await prisma.order.update({
    where: { id: testOrder.id },
    data: { waConfirmationSent: false }
  });

  console.log('Calling sendPOSReceipt...');
  const result = await OrderNotificationService.sendPOSReceipt(testOrder.id);
  console.log('Result:', result);

  // Restore waConfirmationSent to its original state or set to false for manual test
  console.log('Test completed.');
  await prisma.$disconnect();
}

test().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
