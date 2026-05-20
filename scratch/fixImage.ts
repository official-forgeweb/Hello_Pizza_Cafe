import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const slides = await prisma.heroSlide.findMany({
    where: { title: { contains: 'Malai Paneer', mode: 'insensitive' } }
  });
  console.log('HeroSlides:', slides);

  for (const slide of slides) {
    if (!slide.imageUrl || slide.imageUrl.trim() === '' || slide.imageUrl.includes('undefined')) {
       console.log('Updating slide:', slide.id);
       await prisma.heroSlide.update({
         where: { id: slide.id },
         data: { imageUrl: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&q=80&w=800&h=800' } // Sample paneer pizza image
       });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
