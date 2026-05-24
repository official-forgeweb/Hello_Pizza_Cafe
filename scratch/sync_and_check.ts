import prisma from '../lib/prisma';
import { WhatsAppService } from '../lib/services/whatsappService';

async function main() {
  console.log('Fetching templates from Meta...');
  const result = await WhatsAppService.getTemplates();
  if (result.success && result.data) {
    for (const t of result.data) {
      if (t.name === 'pos_order_receipt') {
        console.log(`pos_order_receipt status on Meta: ${t.status}`);
        
        // Sync it to DB
        await prisma.whatsAppTemplate.update({
          where: { templateName: 'pos_order_receipt' },
          data: { status: t.status }
        });
      }
    }
  } else {
    console.error('Failed to sync templates from Meta:', result.error);
  }
  
  const localTemplate = await prisma.whatsAppTemplate.findUnique({
    where: { templateName: 'pos_order_receipt' }
  });
  console.log('Local DB template details:', localTemplate);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
