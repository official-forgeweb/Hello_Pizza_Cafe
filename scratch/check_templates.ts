import prisma from '../lib/prisma';

async function main() {
  const templates = await prisma.whatsAppTemplate.findMany();
  console.log('--- WhatsApp Templates in DB ---');
  console.log(JSON.stringify(templates.map(t => ({
    name: t.templateName,
    status: t.status,
    components: t.components
  })), null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
