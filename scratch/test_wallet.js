require('dotenv').config();
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const { CustomerService } = require('../lib/services/customerService');

async function main() {
  const phone = '9310065542';
  const wallet = await CustomerService.getCustomerLoyaltyWallet(phone);
  console.log("Calculated Wallet for", phone, ":", wallet);
}

main().catch(console.error);
