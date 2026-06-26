require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});
require('tsconfig-paths').register();

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const prismaModule = require('../lib/prisma');
const prisma = prismaModule.default;

async function run() {
  try {
    const phone = '9310065542';
    console.log(`Debugging cloud balance for Sunil (${phone}):`);

    const txs = await prisma.loyaltyTransaction.findMany({
      where: { phoneNumber: phone },
      orderBy: { timestamp: 'asc' } // chronological order just like getCustomerLoyaltyWallet
    });

    console.log(`\nFound ${txs.length} transactions in Cloud:`);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let availableList = [];
    let redeemedTotal = 0;

    console.log('\nProcessing transactions chronological:');
    txs.forEach((tx, idx) => {
      const isPending = tx.type === 'EARN' && tx.timestamp > oneDayAgo;
      const isExpired = tx.expiryDate && tx.expiryDate <= now;
      
      console.log(`[${idx + 1}] ID: ${tx.id.substring(0, 8)}, Type: ${tx.type}, Points: ${tx.points}, Date: ${tx.timestamp.toISOString().substring(0, 10)}, Expiry: ${tx.expiryDate?.toISOString().substring(0, 10)}, Pending: ${isPending}, Expired: ${isExpired}`);

      if (tx.points > 0) {
        if (!isPending && !isExpired) {
          availableList.push({ id: tx.id, points: tx.points, date: tx.timestamp });
        }
      } else {
        redeemedTotal += Math.abs(tx.points);
      }
    });

    console.log(`\nTotal Redeemed: ${redeemedTotal}`);
    console.log('\nApplying redemptions (FIFO):');
    
    let availPoints = 0;
    availableList.forEach(item => {
      const origPoints = item.points;
      if (redeemedTotal >= item.points) {
        redeemedTotal -= item.points;
        item.points = 0;
        console.log(`- Transaction ${item.id.substring(0, 8)} (${origPoints} pts): Fully consumed by redemptions. Remaining redemptions to apply: ${redeemedTotal}`);
      } else {
        item.points -= redeemedTotal;
        redeemedTotal = 0;
        availPoints += item.points;
        console.log(`- Transaction ${item.id.substring(0, 8)} (${origPoints} pts): Partially consumed. Remaining points: ${item.points}. All redemptions applied.`);
      }
    });

    console.log(`\nFinal Calculated Available Points: ${availPoints}`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
