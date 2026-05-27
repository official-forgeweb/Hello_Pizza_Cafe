const http = require('http');

// We will query localhost:3000 where the app runs locally, or fetch from the database directly using the route logic
// Since the dev server is running on c:\Users\lenovo\OneDrive\Desktop\Projects\ZapBill_offline-software (the offline software),
// let's verify if Hello_Pizza_Cafe has a running dev server or if we should run the GET logic directly.
// Let's run the API GET logic directly by mock importing or by making a request to the server if it's running.
// Wait, is there a server running for Hello_Pizza_Cafe?
// The additional metadata says: "npm run dev (in ZapBill_offline-software, running for 47m)".
// So the Hello_Pizza_Cafe server is NOT running.
// Let's run the GET logic using Prisma directly, matching exactly what app/api/menu-items/route.ts does.

const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Matching app/api/menu-items/route.ts GET logic:
  const items = await prisma.menuItem.findMany({
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isAvailable: true },
        orderBy: { displayOrder: "asc" },
      },
      addOns: {
        include: {
          addOn: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const uniqueItemsMap = new Map();
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const price = Number(item.basePrice || 0);
    const existing = uniqueItemsMap.get(key);
    if (!existing) {
      uniqueItemsMap.set(key, item);
    } else {
      const existingPrice = Number(existing.basePrice || 0);
      if (price > existingPrice) {
        uniqueItemsMap.set(key, item);
      }
    }
  }
  const filteredItems = Array.from(uniqueItemsMap.values());

  const shake = filteredItems.find(i => i.name.toLowerCase().includes("chocolate brownie shake"));
  console.log("API returned item for Chocolate Brownie Shake:");
  console.log(JSON.stringify(shake, null, 2));
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
