import prisma from '../lib/prisma';

const HERO_ADS = [
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
];

const SPLASH_ADS = [
  {
    title: "Flat ₹100 OFF",
    subtitle: "On your first order above ₹499",
    code: "HELLO100",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200&h=800",
    gradient: "from-orange-600 to-red-600",
    displayOrder: 1,
    isActive: true,
  },
  {
    title: "Buy 1 Get 1 Free",
    subtitle: "On all large pizzas every Tuesday",
    code: "BOGO",
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=1200&h=800",
    gradient: "from-emerald-600 to-teal-600",
    displayOrder: 2,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding Hero Slides...");
  for (const ad of HERO_ADS) {
    // Check if it already exists to prevent duplicates
    const existing = await prisma.heroSlide.findFirst({ where: { title: ad.title } });
    if (!existing) {
      await prisma.heroSlide.create({ data: ad });
      console.log(`Added Hero Slide: ${ad.title}`);
    } else {
      console.log(`Hero Slide '${ad.title}' already exists.`);
    }
  }

  console.log("\nSeeding Splash Ads...");
  for (const ad of SPLASH_ADS) {
    const existing = await prisma.splashAd.findFirst({ where: { title: ad.title } });
    if (!existing) {
      await prisma.splashAd.create({ data: ad });
      console.log(`Added Splash Ad: ${ad.title}`);
    } else {
      console.log(`Splash Ad '${ad.title}' already exists.`);
    }
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
