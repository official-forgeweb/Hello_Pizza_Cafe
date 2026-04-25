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
  
  // Group categories by name
  const groups = new Map();
  for (const cat of categories) {
    if (!groups.has(cat.name)) {
      groups.set(cat.name, []);
    }
    groups.get(cat.name).push(cat);
  }
  
  let mergedCount = 0;
  
  for (const [name, cats] of groups.entries()) {
    if (cats.length > 1) {
      console.log(`Merging ${cats.length} categories named "${name}"`);
      // Keep the first one, delete the rest
      const primaryCat = cats[0];
      const dupCats = cats.slice(1);
      
      for (const dup of dupCats) {
        // Update menu items to point to primary category
        const updated = await prisma.menuItem.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: primaryCat.id }
        });
        console.log(`  Updated ${updated.count} menu items from ${dup.id} to ${primaryCat.id}`);
        
        // Delete the duplicate category
        await prisma.category.delete({
          where: { id: dup.id }
        });
        console.log(`  Deleted duplicate category ${dup.id}`);
        mergedCount++;
      }
    }
  }
  
  console.log(`Successfully merged ${mergedCount} duplicate categories.`);
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
