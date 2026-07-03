import prisma from '../lib/prisma';

async function main() {
  const template = await prisma.whatsAppTemplate.findUnique({
    where: { templateName: 'pos_order_receipt' }
  });
  console.log('pos_order_receipt Template:', JSON.stringify(template, null, 2));
}

main().catch(console.error);
