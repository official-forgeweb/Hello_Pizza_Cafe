// Register ts-node with tsconfig-paths support for aliases like @/lib/prisma
require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});
require('tsconfig-paths').register();

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const prismaModule = require('../lib/prisma');
const prisma = prismaModule.default;
const { CustomerService } = require('../lib/services/customerService');

async function run() {
  try {
    const phone = '9310065542';
    console.log(`Checking Sunil's wallet in Cloud:`);

    const wallet = await CustomerService.getCustomerLoyaltyWallet(phone);
    console.log('\n--- Calculated Cloud Wallet ---');
    console.log(JSON.stringify(wallet, null, 2));

    const txs = await prisma.loyaltyTransaction.findMany({
      where: { phoneNumber: phone },
      orderBy: { timestamp: 'desc' }
    });
    console.log(`\nFound ${txs.length} transactions in Cloud for Sunil:`);
    txs.slice(0, 5).forEach(tx => {
      console.log(`- ID: ${tx.id}, Type: ${tx.type}, Points: ${tx.points}, Date: ${tx.timestamp}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
