import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Prisma with PG adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Add multiple keys separated by commas in .env, or hardcode them here:
// Example: SPOONACULAR_API_KEYS="key1,key2,key3"
const API_KEYS_STRING = process.env.SPOONACULAR_API_KEYS || "403ed917ceb846b2a6140befcd00575c";
const API_KEYS = API_KEYS_STRING.split(',').map(k => k.trim()).filter(Boolean);

let currentKeyIndex = 0;

function getCurrentKey() {
  if (currentKeyIndex >= API_KEYS.length) {
    throw new Error("ALL_KEYS_EXHAUSTED");
  }
  return API_KEYS[currentKeyIndex];
}

function switchToNextKey() {
  currentKeyIndex++;
  if (currentKeyIndex < API_KEYS.length) {
    console.log(`\n🔄 Switching to backup API Key (${currentKeyIndex + 1}/${API_KEYS.length})...`);
    return true;
  }
  return false;
}

async function searchSpoonacularImage(query: string): Promise<string | null> {
  while (true) {
    try {
      const apiKey = getCurrentKey();
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=1&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 402 || response.status === 401) {
          console.warn(`⚠ Quota exceeded for key: ${apiKey.substring(0, 5)}...`);
          if (switchToNextKey()) {
            continue; // Try again with the new key
          } else {
            throw new Error("ALL_KEYS_EXHAUSTED");
          }
        }
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0 && data.results[0].image) {
        const baseImg = data.results[0].image;
        return baseImg.replace("312x231", "636x393");
      }
      return null;
    } catch (error: any) {
      if (error.message === "ALL_KEYS_EXHAUSTED") {
        throw error;
      }
      console.error(`❌ API Error fetching image for ${query}:`, error);
      throw error;
    }
  }
}

async function main() {
  console.log('=== Spoonacular Multi-Key Image Fetch Script ===');
  
  if (API_KEYS.length === 0 || API_KEYS[0] === "YOUR_API_KEY_HERE") {
    console.log("❌ ERROR: Please set your Spoonacular API keys!");
    console.log("Add SPOONACULAR_API_KEYS=key1,key2,key3 to your .env file.");
    process.exit(1);
  }

  const menuItems = await prisma.menuItem.findMany();
  console.log(`Loaded ${API_KEYS.length} API keys.`);
  console.log(`Found ${menuItems.length} menu items in database.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of menuItems) {
    // Skip items that already have any image (e.g. manually uploaded Cloudinary ones)
    if (item.imageUrl) {
      console.log(`⏭ Skipping "${item.name}" (Already has image: ${item.imageUrl})`);
      skipped++;
      continue;
    }
    
    console.log(`🔍 Searching for: "${item.name}"...`);
    
    try {
      // Clean up name for better search results
      let searchQuery = item.name;
      if (searchQuery.toLowerCase().includes("pizza")) {
         searchQuery = searchQuery.replace(/pizza/i, "").trim() + " pizza";
      }
      // Remove text in brackets like (No Onion)
      searchQuery = searchQuery.replace(/\(.*?\)/g, "").trim();

      const newImageUrl = await searchSpoonacularImage(searchQuery);

      if (newImageUrl) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { imageUrl: newImageUrl }
        });
        console.log(`✅ UPDATED: "${item.name}" -> ${newImageUrl}`);
        updated++;
      } else {
        console.log(`⚠ NO RESULTS: Could not find image for "${item.name}"`);
        failed++;
      }
      
      // Sleep for 1.5 seconds to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error: any) {
      if (error.message === "ALL_KEYS_EXHAUSTED") {
        console.log("\n🛑 FATAL: All provided Spoonacular API Keys have run out of quota for today!");
        break;
      }
      failed++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total processed: ${menuItems.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Already had image (Skipped): ${skipped}`);
  console.log(`Failed to find images: ${failed}`);
  console.log('=================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
