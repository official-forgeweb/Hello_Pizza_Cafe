import dotenv from 'dotenv';
dotenv.config();

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

async function main() {
  const { CustomerService } = await import('../lib/services/customerService');
  const phone = '9310065542';
  const wallet = await CustomerService.getCustomerLoyaltyWallet(phone);
  console.log("Calculated Wallet for", phone, ":", wallet);
}

main().catch(console.error);
