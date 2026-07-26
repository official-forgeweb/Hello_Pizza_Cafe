import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { default: prisma } = await import('../lib/prisma');
  const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
  console.log(`Access Token present: ${!!token}`);
}

main().catch(console.error);
