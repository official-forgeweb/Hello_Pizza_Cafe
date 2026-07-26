import dotenv from 'dotenv';
dotenv.config();

// Override DATABASE_URL with DIRECT_URL if pgpool SCRAM error occurs with pgbouncer
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import { CustomerService } from '../lib/services/customerService';

async function main() {
  const phone = '9310065542';
  const wallet = await CustomerService.getCustomerLoyaltyWallet(phone);
  console.log("Calculated Wallet for", phone, ":", wallet);
}

main().catch(console.error);
