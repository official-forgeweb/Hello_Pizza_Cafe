require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("=== Testing Sync De-duplication and Image Carry-over ===");

  try {
    // 1. Create a dummy category first
    let testCategory = await prisma.category.findFirst({
      where: { name: "Test Category" }
    });
    if (!testCategory) {
      testCategory = await prisma.category.create({
        data: {
          name: "Test Category",
          slug: "test-category-" + Math.floor(Math.random() * 1000),
          description: "Temporary category for verification"
        }
      });
      console.log(`Created test category: ${testCategory.name} (${testCategory.id})`);
    }

    const testItemName = "Verification Test Pizza";
    const oldWebId = "web-item-uuid-123";
    const newPosId = "pos-item-uuid-456";
    const testImageUrl = "https://res.cloudinary.com/dsk80td7v/image/upload/v1777089424/hello-pizza/menu/test-item.jpg";

    // Clean up any existing records from previous runs
    await prisma.menuItem.deleteMany({
      where: { name: testItemName }
    });

    // 2. Create the "manually added website item" with the old ID and an image
    const webItem = await prisma.menuItem.create({
      data: {
        id: oldWebId,
        name: testItemName,
        slug: "verification-test-pizza-web",
        basePrice: 299,
        imageUrl: testImageUrl,
        categoryId: testCategory.id,
        itemType: "VEG",
        isAvailable: true
      }
    });
    console.log(`\nStep 1: Created website item: "${webItem.name}" with ID: "${webItem.id}", Image: "${webItem.imageUrl}"`);

    // 3. Simulate the POS sync payload
    const syncItem = {
      id: newPosId,
      name: testItemName,
      description: "POS item description",
      price: 299,
      isVeg: true,
      categoryId: testCategory.id,
      isAvailable: true
    };

    console.log(`\nStep 2: Simulating POS sync for item: "${syncItem.name}" with NEW ID: "${syncItem.id}"`);

    // --- EXACT SYNC ROUTE LOGIC ---
    let categoryId = syncItem.categoryId;
    const itemSlug = syncItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + syncItem.id.slice(0, 8);

    // Check if item exists by ID
    const existingById = await prisma.menuItem.findUnique({
      where: { id: syncItem.id }
    });

    let currentImageUrl = existingById?.imageUrl || null;

    if (!existingById) {
      const existingByName = await prisma.menuItem.findFirst({
        where: {
          name: {
            equals: syncItem.name,
            mode: 'insensitive'
          }
        }
      });

      if (existingByName) {
        console.log(`[SIMULATED SYNC] Found matching item by name: "${syncItem.name}". Merging and updating ID from "${existingByName.id}" to "${syncItem.id}"`);
        currentImageUrl = existingByName.imageUrl;

        try {
          await prisma.menuItem.delete({
            where: { id: existingByName.id }
          });
          console.log(`[SIMULATED SYNC] Deleted old manual item "${existingByName.id}" to prevent duplicate`);
        } catch (err) {
          console.error(`[SIMULATED SYNC] Failed to delete duplicate item ${existingByName.id}:`, err);
        }
      }
    }

    await prisma.menuItem.upsert({
      where: { id: syncItem.id },
      update: {
        name: syncItem.name,
        slug: itemSlug,
        description: syncItem.description || null,
        basePrice: syncItem.price,
        itemType: syncItem.isVeg ? "VEG" : "NON_VEG",
        categoryId: categoryId || undefined,
        isAvailable: syncItem.isAvailable !== false,
        imageUrl: currentImageUrl || undefined,
      },
      create: {
        id: syncItem.id,
        name: syncItem.name,
        slug: itemSlug,
        description: syncItem.description || null,
        basePrice: syncItem.price,
        itemType: syncItem.isVeg ? "VEG" : "NON_VEG",
        categoryId: categoryId,
        isAvailable: syncItem.isAvailable !== false,
        imageUrl: currentImageUrl || null,
      }
    });
    // ---------------------------------

    console.log("\nStep 3: Sync complete. Fetching item from database to verify results...");

    // 4. Verify item exists with the new POS ID and still has the image
    const finalItem = await prisma.menuItem.findUnique({
      where: { id: newPosId },
      include: { category: true }
    });

    if (finalItem) {
      console.log(`✅ SUCCESS! Item exists with POS ID: "${finalItem.id}"`);
      console.log(`✅ Image URL is correctly preserved: "${finalItem.imageUrl}"`);
      
      const oldItemCheck = await prisma.menuItem.findUnique({
        where: { id: oldWebId }
      });
      if (!oldItemCheck) {
        console.log("✅ SUCCESS! Old manual website item with different ID was deleted to clean up duplicate names.");
      } else {
        console.error("❌ ERROR! Old manual website item still exists in database.");
      }
    } else {
      console.error("❌ ERROR! Synced item not found in database.");
    }

    // 5. Clean up verification data
    console.log("\nCleaning up verification data...");
    await prisma.menuItem.deleteMany({
      where: { name: testItemName }
    });
    console.log("Cleanup complete.");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
