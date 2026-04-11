import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  try {
    // 1. Admin User
    const adminExists = await prisma.adminUser.findUnique({
      where: { email: 'admin@hellopizza.com' },
    });

    if (!adminExists) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.adminUser.create({
        data: {
          name: 'Admin',
          email: 'admin@hellopizza.com',
          passwordHash: hashedPassword,
        },
      });
      console.log('Admin user created.');
    }

    // 2. Default Categories
    const categories = [
      { name: "Veg Pizza", slug: "veg-pizza", isActive: true },
      { name: "Non-Veg Pizza", slug: "non-veg-pizza", isActive: true },
      { name: "Burgers", slug: "burgers", isActive: true },
      { name: "Sides", slug: "sides", isActive: true },
      { name: "Beverages", slug: "beverages", isActive: true },
      { name: "Desserts", slug: "desserts", isActive: true },
    ];

    console.log('Seeding categories...');
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    // 3. Default Hero Slides
    console.log('Seeding hero slides...');
    const totalSlides = await prisma.heroSlide.count();
    
    if (totalSlides === 0) {
      await prisma.heroSlide.createMany({
        data: [
          {
            title: "Spicy Paneer Volcano",
            description: "Double cheese burst loaded with extra spicy peri-peri paneer.",
            imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=800",
            tag: "NEW 🔥",
            displayOrder: 1,
            isActive: true,
          },
          {
            title: "Buy 1 Get 1 Free",
            description: "Enjoy our weekend festival offers on select pizzas.",
            imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800&h=800",
            tag: "OFFER ✨",
            displayOrder: 2,
            isActive: true,
          },
          {
            title: "Midnight Craving",
            description: "20% off all orders between 11PM and 3AM.",
            imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800&h=800",
            tag: "20% OFF",
            displayOrder: 3,
            isActive: true,
          },
          {
            title: "Classic Pepperoni",
            description: "Our undisputed best seller across all stores.",
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800&h=800",
            tag: "BEST SELLER",
            displayOrder: 4,
            isActive: true,
          }
        ]
      });
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
