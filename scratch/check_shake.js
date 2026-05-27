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
  const items = await prisma.menuItem.findMany({
    where: {
      name: {
        contains: "Chocolate Brownie Shake",
        mode: "insensitive",
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        }
      },
    },
  });

  console.log("Matching items:");
  console.log(JSON.stringify(items, null, 2));
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
