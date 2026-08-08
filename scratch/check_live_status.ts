import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');

  console.log('=== REAL-TIME WEBSITE & POS WHATSAPP VERIFICATION ===\n');

  // 1. Fetch last 10 Orders
  const orders = await prisma.order.findMany({
    orderBy: { placedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      status: true,
      isSynced: true,
      waConfirmationSent: true,
      placedAt: true,
    }
  });

  console.log('--- RECENT ORDERS STATUS ---');
  orders.forEach(o => {
    console.log(
      `Order# ${o.orderNumber.padEnd(10)} | Phone: ${(o.customerPhone || 'N/A').padEnd(12)} | Status: ${o.status.padEnd(10)} | Synced: ${o.isSynced ? 'Yes' : 'No '} | WA Sent: ${o.waConfirmationSent ? 'YES' : 'NO '} | Placed: ${o.placedAt?.toISOString().slice(0,19)}`
    );
  });

  // 2. Fetch last 10 Message Logs
  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      phone: true,
      messageType: true,
      templateUsed: true,
      status: true,
      createdAt: true,
      sentAt: true,
      errorMessage: true
    }
  });

  console.log('\n--- RECENT WHATSAPP MESSAGE LOGS ---');
  if (logs.length === 0) {
    console.log('No message logs recorded yet.');
  } else {
    logs.forEach(l => {
      const time = l.sentAt ? l.sentAt.toISOString().slice(0,19) : (l.createdAt ? l.createdAt.toISOString().slice(0,19) : 'N/A');
      console.log(
        `Time: ${time} | Phone: ${l.phone.padEnd(12)} | Template: ${l.templateUsed} | Status: ${l.status.toUpperCase()} ${l.errorMessage ? '| ERR: ' + l.errorMessage : ''}`
      );
    });
  }
}

main().catch(console.error);
