import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Prisma with PG adapter (same as lib/prisma.ts)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Cloudinary Upload Script ===');
  console.log(`Cloud Name: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`);

  const menuItems = await prisma.menuItem.findMany();
  console.log(`Found ${menuItems.length} menu items in database.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of menuItems) {
    // Only process items that have a local /menu-images/ path
    if (!item.imageUrl || !item.imageUrl.startsWith('/menu-images/')) {
      console.log(`⏭ SKIP: "${item.name}" — imageUrl is already external or empty (${item.imageUrl || 'null'})`);
      skipped++;
      continue;
    }

    const fileName = item.imageUrl.replace('/menu-images/', '');
    const filePath = path.join(__dirname, '..', 'public', 'menu-images', fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ NOT FOUND: "${item.name}" — file missing at ${filePath}`);
      failed++;
      continue;
    }

    try {
      // Upload to Cloudinary under hello-pizza/menu folder
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'hello-pizza/menu',
        public_id: path.parse(fileName).name, // use filename without extension as public_id
        overwrite: true,
        resource_type: 'image',
      });

      // Update database with the Cloudinary URL
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: result.secure_url },
      });

      uploaded++;
      console.log(`✅ ${uploaded}. "${item.name}" → ${result.secure_url}`);
    } catch (error: any) {
      failed++;
      console.error(`❌ FAILED: "${item.name}" — ${error.message}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`⏭ Skipped:  ${skipped}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`📦 Total:    ${menuItems.length}`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
