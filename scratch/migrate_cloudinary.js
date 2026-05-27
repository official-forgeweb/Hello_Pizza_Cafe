const { PrismaClient } = require("@prisma/client");
const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateUrl(oldUrl, folderName = "hello-pizza/menu") {
  if (!oldUrl || !oldUrl.includes("/hello-pizza/ads/")) {
    return null;
  }
  
  try {
    console.log(`Migrating image to avoid ad blockers: "${oldUrl}" -> copying to folder: "${folderName}"`);
    // We upload to Cloudinary using the existing URL as source
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: folderName,
    });
    console.log(`Successfully copied to new URL: "${result.secure_url}"`);
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to copy image: ${oldUrl}`, error);
    return null;
  }
}

async function main() {
  console.log("Starting database image migrations to resolve ad blocker issues...");

  // 1. Migrate MenuItem
  const menuItems = await prisma.menuItem.findMany({
    where: {
      imageUrl: {
        contains: "/hello-pizza/ads/",
      },
    },
  });
  console.log(`Found ${menuItems.length} menu items with /hello-pizza/ads/ images.`);
  for (const item of menuItems) {
    const newUrl = await migrateUrl(item.imageUrl, "hello-pizza/menu");
    if (newUrl) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: newUrl },
      });
      console.log(`Updated MenuItem "${item.name}" (ID: ${item.id}) with new URL.`);
    }
  }

  // 2. Migrate Category
  const categories = await prisma.category.findMany({
    where: {
      imageUrl: {
        contains: "/hello-pizza/ads/",
      },
    },
  });
  console.log(`Found ${categories.length} categories with /hello-pizza/ads/ images.`);
  for (const cat of categories) {
    const newUrl = await migrateUrl(cat.imageUrl, "hello-pizza/menu");
    if (newUrl) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { imageUrl: newUrl },
      });
      console.log(`Updated Category "${cat.name}" (ID: ${cat.id}) with new URL.`);
    }
  }

  // 3. Migrate HeroSlide
  const heroSlides = await prisma.heroSlide.findMany({
    where: {
      imageUrl: {
        contains: "/hello-pizza/ads/",
      },
    },
  });
  console.log(`Found ${heroSlides.length} hero slides with /hello-pizza/ads/ images.`);
  for (const slide of heroSlides) {
    const newUrl = await migrateUrl(slide.imageUrl, "hello-pizza/hero");
    if (newUrl) {
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { imageUrl: newUrl },
      });
      console.log(`Updated HeroSlide "${slide.title}" (ID: ${slide.id}) with new URL.`);
    }
  }

  // 4. Migrate SplashAd
  const splashAds = await prisma.splashAd.findMany({
    where: {
      imageUrl: {
        contains: "/hello-pizza/ads/",
      },
    },
  });
  console.log(`Found ${splashAds.length} splash ads with /hello-pizza/ads/ images.`);
  for (const ad of splashAds) {
    const newUrl = await migrateUrl(ad.imageUrl, "hello-pizza/splash");
    if (newUrl) {
      await prisma.splashAd.update({
        where: { id: ad.id },
        data: { imageUrl: newUrl },
      });
      console.log(`Updated SplashAd "${ad.title}" (ID: ${ad.id}) with new URL.`);
    }
  }

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
