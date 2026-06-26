require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const prismaModule = require('../lib/prisma');
const prisma = prismaModule.default;
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const phone = '9310065542';
    const campaignId = '401f11c5-92d4-46b4-a49a-94ad59f5d6bc'; // loyalty_test_2
    
    console.log(`Manually crediting 200 points to Sunil (${phone}) for campaign ${campaignId}...`);

    // Create the transaction in Cloud Postgres
    const tx = await prisma.loyaltyTransaction.create({
      data: {
        id: uuidv4(),
        phoneNumber: phone,
        type: 'BONUS',
        points: 200,
        timestamp: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isPending: true,
        campaignId: campaignId
      }
    });

    console.log('Successfully created cloud loyalty transaction:', JSON.stringify(tx, null, 2));

  } catch (err) {
    console.error('Error crediting points:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
