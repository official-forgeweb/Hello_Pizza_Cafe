import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany();
  console.log(`Total categories: ${categories.length}`);
  
  // Find duplicates by name
  const seen = new Map();
  const duplicates = [];
  
  for (const cat of categories) {
    if (seen.has(cat.name)) {
      duplicates.push(cat);
    } else {
      seen.set(cat.name, cat.id);
    }
  }
  
  console.log(`Found ${duplicates.length} duplicate categories.`);
  
  if (duplicates.length > 0) {
    console.log('Deleting duplicates...');
    // Delete duplicates where they have no menu items (or we just delete by ID)
    // Actually we should only delete if they have no menu items, or just delete the duplicates that were created later.
    
    let deletedCount = 0;
    for (const dup of duplicates) {
      try {
        await prisma.category.delete({
          where: { id: dup.id }
        });
        deletedCount++;
      } catch (e: any) {
        console.error(`Could not delete ${dup.name} (${dup.id}):`, e.message);
      }
    }
    console.log(`Deleted ${deletedCount} duplicate categories.`);
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
