import prisma from '../lib/prisma';

const BEST_SELLERS = [
  {
    title: "Margherita Classica",
    description: "San Marzano tomatoes, fresh mozzarella, aromatic basil leaves",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=600&h=450",
    tag: "BESTSELLER",
    displayOrder: 1,
    isActive: true,
  },
  {
    title: "Pepperoni Overload",
    description: "Double pepperoni, mozzarella, red onions, and chili flakes",
    imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600&h=450",
    tag: "BESTSELLER",
    displayOrder: 2,
    isActive: true,
  },
  {
    title: "Farmhouse Special",
    description: "Capsicum, onion, tomato, mushroom with Italian herbs",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600&h=450",
    tag: "BESTSELLER",
    displayOrder: 3,
    isActive: true,
  },
  {
    title: "BBQ Chicken Supreme",
    description: "Smoky BBQ chicken, caramelized onions, jalapeños",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600&h=450",
    tag: "BESTSELLER",
    displayOrder: 4,
    isActive: true,
  },
];

async function main() {
  console.log("Clearing old Hero Slides...");
  await prisma.heroSlide.deleteMany();

  console.log("Seeding Hero Slides with Best Sellers from Home Page...");
  for (const ad of BEST_SELLERS) {
    await prisma.heroSlide.create({ data: ad });
    console.log(`Added Hero Slide: ${ad.title}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
