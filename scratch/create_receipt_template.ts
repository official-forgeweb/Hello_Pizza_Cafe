import { WhatsAppService } from '../lib/services/whatsappService';
import prisma from '../lib/prisma';

async function main() {
  const templateName = 'pos_order_receipt';
  const category = 'UTILITY'; // receipts and transaction confirmations are utility
  const language = 'en_US';
  
  const components = [
    {
      type: 'BODY',
      text: 'Receipt from Hello Pizza Cafe 🍕\n\nAmount Paid: ₹{{1}}\n\nMade fresh. Served hot.\nHope to welcome you again soon ✨',
      example: {
        body_text: [
          ['450']
        ]
      }
    }
  ];

  console.log(`Attempting to register template '${templateName}' on Meta...`);
  
  const metaResult = await WhatsAppService.createTemplate({
    name: templateName,
    category,
    language,
    components
  });

  if (!metaResult.success) {
    console.error('Failed to create template on Meta:', metaResult.error);
    process.exit(1);
  }

  console.log('Template created successfully on Meta. Syncing to local DB...');

  const metaTemplateId = metaResult.data?.id || null;
  const variables = ['Variable 1']; // {{1}} is bill amount

  const template = await prisma.whatsAppTemplate.upsert({
    where: { templateName },
    update: {
      category,
      language,
      status: 'PENDING', // starts as pending approval
      components,
      variables,
      metaTemplateId,
    },
    create: {
      templateName,
      category,
      language,
      status: 'PENDING',
      components,
      variables,
      metaTemplateId,
    }
  });

  console.log('Template successfully synced to database:', template);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
