import "dotenv/config";
import prisma from "../lib/prisma";
import { ensureMenuItemImage } from "../lib/image-manager";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("🚀 Starting Bulk Image Fetcher...");
  
  if (!process.env.UNSPLASH_ACCESS_KEY && !process.env.PEXELS_API_KEY) {
    console.warn("⚠️  WARNING: No UNSPLASH_ACCESS_KEY or PEXELS_API_KEY found in .env!");
    console.warn("API fetches will likely fail. Proceeding anyway to check existing Local files...");
  }

  const items = await prisma.menuItem.findMany();
  console.log(`Found ${items.length} menu items.`);

  let processed = 0;
  let downloaded = 0;
  let failed = 0;

  for (const item of items) {
    process.stdout.write(`[${processed + 1}/${items.length}] Checking ${item.name}... `);
    
    try {
      const result = await ensureMenuItemImage(item.id, item.name, item.imageUrl);
      
      if (result) {
        if (result === item.imageUrl) {
          console.log("✅ Already exists.");
        } else {
          console.log(`✅ Downloaded (${result})`);
          downloaded++;
          // Wait 2 seconds to avoid Unsplash rate limits
          await delay(2000);
        }
      } else {
        console.log("❌ Failed to get image.");
        failed++;
        // Wait 2 seconds anyway so we don't spam 404/rate limits
        await delay(2000);
      }
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
      failed++;
    }
    
    processed++;
  }

  console.log("-----------------------------------------");
  console.log(`🎉 Job Complete!`);
  console.log(`Total: ${items.length} | Newly Downloaded: ${downloaded} | Failed/Missing: ${failed}`);
  process.exit(0);
}

run();
