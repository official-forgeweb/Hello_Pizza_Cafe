import prisma from '../lib/prisma';

async function main() {
  try {
    console.log("Querying SplashAd table via lib/prisma...");
    const ads = await prisma.splashAd.findMany();
    console.log("Query successful! Found ads count:", ads.length);
    console.log("Ads:", ads);
  } catch (error) {
    console.error("Query failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
