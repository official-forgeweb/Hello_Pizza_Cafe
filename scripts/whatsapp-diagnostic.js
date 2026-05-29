require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== WhatsApp Diagnostic Report ===\n');

  // 1. Check recent orders and their WhatsApp status
  const recentOrders = await prisma.order.findMany({
    orderBy: { placedAt: 'desc' },
    take: 20,
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

  console.log('--- Last 20 Orders ---');
  console.log('Order#  | Customer          | Phone        | Status     | Synced | WA Sent | Placed At');
  console.log('-'.repeat(100));
  for (const o of recentOrders) {
    console.log(
      `${o.orderNumber.padEnd(8)}| ${(o.customerName || '').padEnd(18)}| ${(o.customerPhone || '').padEnd(13)}| ${(o.status || '').padEnd(11)}| ${o.isSynced ? 'Yes' : 'No'.padEnd(7)}| ${o.waConfirmationSent ? 'Yes' : 'NO '.padEnd(8)}| ${o.placedAt?.toISOString().slice(0,16)}`
    );
  }

  // 2. Check how many orders have waConfirmationSent = false with a valid phone
  const unsentCount = await prisma.order.count({
    where: {
      waConfirmationSent: false,
      customerPhone: { not: '0000000000' },
      NOT: { customerPhone: '' },
    }
  });
  console.log(`\n--- Orders with WhatsApp NOT sent (valid phone): ${unsentCount} ---`);

  // 3. Check recent message logs
  const recentMessages = await prisma.messageLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 10,
    select: {
      id: true,
      phone: true,
      messageType: true,
      templateUsed: true,
      status: true,
      errorMessage: true,
      sentAt: true,
    }
  });

  console.log('\n--- Last 10 WhatsApp Message Logs ---');
  if (recentMessages.length === 0) {
    console.log('  NO message logs found at all!');
  } else {
    for (const m of recentMessages) {
      console.log(`  ${m.sentAt?.toISOString().slice(0,16)} | ${m.phone} | ${m.templateUsed} | ${m.status} ${m.errorMessage ? '| ERR: ' + m.errorMessage : ''}`);
    }
  }

  // 4. Check WhatsApp config
  const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
  console.log(`\n--- WhatsApp Config ---`);
  console.log(`  Access Token: ${hasToken ? 'SET (' + process.env.WHATSAPP_ACCESS_TOKEN.slice(0,20) + '...)' : 'MISSING!'}`);
  console.log(`  Phone Number ID: ${hasPhoneId ? process.env.WHATSAPP_PHONE_NUMBER_ID : 'MISSING!'}`);

  // 5. Check for orders that are synced but WA not sent
  const syncedNoWA = await prisma.order.findMany({
    where: {
      isSynced: true,
      waConfirmationSent: false,
      customerPhone: { not: '0000000000' },
      NOT: { customerPhone: '' },
    },
    take: 5,
    orderBy: { placedAt: 'desc' },
    select: {
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      placedAt: true,
    }
  });

  if (syncedNoWA.length > 0) {
    console.log(`\n--- Synced Orders with NO WhatsApp sent ---`);
    for (const o of syncedNoWA) {
      console.log(`  Order ${o.orderNumber} | ${o.customerName} | ${o.customerPhone} | ${o.placedAt?.toISOString().slice(0,16)}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
