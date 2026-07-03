const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.messageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Latest message logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error);
