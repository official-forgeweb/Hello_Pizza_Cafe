"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  MapPin,
  Star,
  Clock,
  Truck,
  Award,
  Search,
  Pizza,
  Beef,
  Sandwich,
  UtensilsCrossed,
  CupSoda,
  Cake,
  Gift,
  Utensils,
  Quote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MenuItemCard, { type MenuItemData } from "@/components/menu/MenuItemCard";

// ─── Mock Data ────────────────────────────────────────────────
const HERO_ITEM = {
  badge: "Today's Special",
  title: "Spicy Paneer Volcano",
  description:
    "Double cheese burst loaded with extra spicy peri-peri paneer, jalapeños, and our secret volcano sauce.",
  price: 449,
  originalPrice: 599,
  image:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200&h=800",
};

const CATEGORIES = [
  { id: "1", name: "Veg Pizza", icon: Pizza },
  { id: "2", name: "Non-Veg Pizza", icon: Beef },
  { id: "3", name: "Burgers", icon: Sandwich },
  { id: "4", name: "Sides", icon: UtensilsCrossed },
  { id: "5", name: "Beverages", icon: CupSoda },
  { id: "6", name: "Desserts", icon: Cake },
  { id: "7", name: "Combos", icon: Gift },
  { id: "8", name: "Pasta", icon: Utensils },
];

const BEST_SELLERS: MenuItemData[] = [
  {
    id: "b1",
    name: "Margherita Classica",
    description: "San Marzano tomatoes, fresh mozzarella, aromatic basil leaves",
    price: 299,
    imageUrl:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: "b2",
    name: "Pepperoni Overload",
    description: "Double pepperoni, mozzarella, red onions, and chili flakes",
    price: 449,
    imageUrl:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    isBestSeller: true,
  },
  {
    id: "b3",
    name: "Farmhouse Special",
    description: "Capsicum, onion, tomato, mushroom with Italian herbs",
    price: 359,
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: "b4",
    name: "BBQ Chicken Supreme",
    description: "Smoky BBQ chicken, caramelized onions, jalapeños",
    price: 499,
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    isBestSeller: true,
  },
];

const REVIEWS = [
  {
    id: 1,
    name: "Rahul Sharma",
    rating: 5,
    text: "Absolutely the best pizza in Delhi! The crust is perfectly thin and crispy, and the toppings are always fresh. My go-to for weekend dinners.",
    date: "2 days ago",
    initial: "RS",
    orderedItem: "Margherita Classica",
  },
  {
    id: 2,
    name: "Priya Mehra",
    rating: 5,
    text: "Delivery was super fast — arrived in just 25 minutes! Pizza was piping hot and tasted amazing. The paneer pizza is a must try.",
    date: "1 week ago",
    initial: "PM",
    orderedItem: "Paneer Tikka Pizza",
  },
  {
    id: 3,
    name: "Amit Kumar",
    rating: 4,
    text: "Great value for money. The combo deals are fantastic. Everything else is perfect!",
    date: "2 weeks ago",
    initial: "AK",
    orderedItem: "Family Feast Combo",
  },
  {
    id: 4,
    name: "Sneha Gupta",
    rating: 5,
    text: "The BBQ Chicken pizza here is something else! Rich smoky flavors with the perfect amount of cheese. Highly recommended for chicken lovers.",
    date: "3 weeks ago",
    initial: "SG",
    orderedItem: "BBQ Chicken Supreme",
  },
  {
    id: 5,
    name: "Vikram Singh",
    rating: 5,
    text: "Tried the new Spicy Paneer Volcano and it actually lives up to its name! Warning: it's seriously hot but so delicious.",
    date: "4 days ago",
    initial: "VS",
    orderedItem: "Spicy Paneer Volcano",
  },
  {
    id: 6,
    name: "Anjali Rao",
    rating: 5,
    text: "The Choco Lava cake is to die for. Perfectly molten center and not overly sweet. It's the perfect way to end a meal.",
    date: "2 weeks ago",
    initial: "AR",
    orderedItem: "Choco Lava Cake",
  },
  {
    id: 7,
    name: "Karan Johar",
    rating: 5,
    text: "Consistently good quality. I've ordered 10+ times and it's never disappointed. The crust quality is better than most chain pizzerias.",
    date: "1 month ago",
    initial: "KJ",
    orderedItem: "Farmhouse Supreme",
  },
  {
    id: 8,
    name: "Ishita Dutta",
    rating: 4,
    text: "Loaded fries were a bit soggy this time, but the pizza was top notch. Customer service handled my concern immediately. 5 stars for service!",
    date: "3 days ago",
    initial: "ID",
    orderedItem: "Loaded Fries",
  },
];

const USP_ITEMS = [
  { icon: Clock, title: "30 Min Delivery", desc: "Or it's free!" },
  { icon: Award, title: "Fresh Ingredients", desc: "Daily sourced" },
  { icon: Truck, title: "Free Delivery", desc: "On orders ₹499+" },
];

const ADS_DATA = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=800",
    title: "Spicy Paneer Volcano",
    tag: "NEW 🔥",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800&h=800",
    title: "Buy 1 Get 1 Free",
    tag: "OFFER ✨",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800&h=800",
    title: "Midnight Craving",
    tag: "20% OFF",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800&h=800",
    title: "Classic Pepperoni",
    tag: "BEST SELLER",
  }
];

// ─── Animated Section Wrapper ─────────────────────────────────
function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

import { useLocationStore } from "@/store/location";

// ─── Main Page ────────────────────────────────────────────────
export default function HomePage() {
  const { address } = useLocationStore();

  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 500], [0, 150]);

  // Dynamic state
  const [categories, setCategories] = useState<any[]>(CATEGORIES);
  const [adsData, setAdsData] = useState<any[]>(ADS_DATA);
  const [bestSellers, setBestSellers] = useState<any[]>(BEST_SELLERS);

  useEffect(() => {
    // Fetch live categories and ads from the new DB APIs
    const fetchLiveDbData = async () => {
      try {
        const [catRes, heroRes, bestRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/admin/hero-slides"),
          fetch("/api/menu-items?bestSellers=true&limit=8")
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.length > 0) {
            // Map the Icon string to an actual lucide icon or fallback
            // since DB doesn't store components
            const mappedCat = catData.map((c: any) => {
              let icon = Pizza;
              if (c.name.toLowerCase().includes("non-veg")) icon = Beef;
              else if (c.name.toLowerCase().includes("burger")) icon = Sandwich;
              else if (c.name.toLowerCase().includes("side")) icon = UtensilsCrossed;
              else if (c.name.toLowerCase().includes("beverage")) icon = CupSoda;
              else if (c.name.toLowerCase().includes("dessert")) icon = Cake;
              else if (c.name.toLowerCase().includes("combo")) icon = Gift;
              else if (c.name.toLowerCase().includes("pasta")) icon = Utensils;
              
              return {
                id: c.id,
                name: c.name,
                icon,
              };
            });
            setCategories(mappedCat);
          }
        }

        if (heroRes.ok) {
          const heroData = await heroRes.json();
          const activeHeroes = heroData.filter((h: any) => h.isActive);
          if (activeHeroes.length > 0) {
            setAdsData(activeHeroes);
          }
        }

        if (bestRes.ok) {
          const data = await bestRes.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            setBestSellers(data.items.map((i: any) => ({
              ...i,
              price: Number(i.basePrice || i.price),
              isVeg: i.itemType === "VEG" || i.isVeg === true
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch live home data:", err);
      }
    };
    fetchLiveDbData();
  }, []);

  useEffect(() => {
    const container = document.getElementById("ads-gallery");
    if (!container) return;
    
    let animationId: number;
    
    const scrollStep = () => {
      if (container.matches(":hover") || container.matches(":active") || container.dataset.isDown === "true") {
        animationId = requestAnimationFrame(scrollStep);
        return;
      }
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 50) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 1;
      }
      
      animationId = requestAnimationFrame(scrollStep);
    };
    
    animationId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationId);
  }, [adsData]);

  return (
    <div className="flex flex-col pb-24 md:pb-0">
      {/* ═══ Hero Section (Premium Layout) ═══ */}
      <section className="relative w-full min-h-[80vh] flex items-center pt-24 pb-12 overflow-hidden bg-warm-900 border-b-4 border-primary">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000&h=1200"
            alt="Premium Pizza Background"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        {/* Floating Abstract Shapes */}
        <motion.div 
          animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-primary/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen z-0" 
        />
        
        <div className="relative z-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pt-10 hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {HERO_ITEM.badge}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Handcrafted <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-orange">Perfection</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8 max-w-xl font-light">
              Experience the art of authentic pizza-making. We blend premium ingredients, traditional techniques, and modern flavors.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/menu">
                <motion.button
                  className="relative overflow-hidden group bg-primary text-white px-8 py-4 rounded-full font-bold shadow-[0_0_40px_-10px_rgba(227,24,55,0.8)] hover:shadow-[0_0_60px_-15px_rgba(227,24,55,1)] transition-all duration-300"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Order Now
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </motion.button>
              </Link>
              <Link href="/menu">
                <motion.button
                  className="px-8 py-4 rounded-full font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  whileTap={{ scale: 0.98 }}
                >
                  View Menu
                </motion.button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-white/60">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-warm-800 flex items-center justify-center overflow-hidden">
                    <Image src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" width={40} height={40} />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="text-white font-bold">10,000+ Happy Customers</p>
                <div className="flex text-amber-400 mt-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Right side Auto-Scrolling Ads Gallery */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: -2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 80 }}
            className="relative w-full lg:w-auto overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] bg-white/5 backdrop-blur-sm mx-auto"
          >
            <div 
              id="ads-gallery"
              className="relative w-full h-[450px] lg:w-[500px] lg:h-[550px] flex items-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ scrollBehavior: "auto" }}
              onMouseDown={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = "true";
                el.dataset.startX = (e.pageX - el.offsetLeft).toString();
                el.dataset.scrollLeft = el.scrollLeft.toString();
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = "false";
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget;
                el.dataset.isDown = "false";
              }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                if (el.dataset.isDown !== "true") return;
                e.preventDefault();
                const startX = parseFloat(el.dataset.startX || "0");
                const scrollLeft = parseFloat(el.dataset.scrollLeft || "0");
                const x = e.pageX - el.offsetLeft;
                const walk = (x - startX) * 1.5; // Scroll speed factor
                el.scrollLeft = scrollLeft - walk;
              }}
            >
              <div
                className="flex items-center gap-6 px-6"
                style={{ width: "max-content", paddingRight: "24px" }}
              >
                {/* Loop highly dynamically so it spans perfectly */}
                {[...adsData, ...adsData, ...adsData].map((ad, idx) => (
                  <div 
                    key={`${ad.id}-${idx}`} 
                    className="relative w-[80vw] max-w-[380px] h-[400px] lg:h-[480px] flex-shrink-0 rounded-[2rem] overflow-hidden group cursor-pointer border border-white/20 hover:border-primary/50 transition-colors"
                  >
                    <Image
                      src={ad.image || ad.imageUrl}
                      alt={ad.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 group-hover:-rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                    
                    <div className="absolute top-6 left-6">
                      <span className="bg-primary/95 shadow-[0_4px_20px_rgba(227,24,55,0.5)] backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border border-white/20">
                        {ad.tag}
                      </span>
                    </div>
                    
                    <div className="absolute bottom-8 left-6 right-6">
                      <h3 className="text-white text-3xl font-bold leading-tight mb-4">
                        {ad.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 bg-white text-warm-900 px-5 py-3 rounded-xl text-sm font-bold w-max group-hover:bg-primary group-hover:text-white transition-colors shadow-lg">
                        Explore Now <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Mobile CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="lg:hidden col-span-1 flex justify-center pt-6 pb-2"
          >
            <button 
              onClick={() => document.getElementById('categories-section')?.scrollIntoView({behavior: 'smooth'})} 
              className="px-8 py-4 w-[80vw] max-w-[380px] rounded-2xl font-bold text-white bg-primary shadow-[0_8px_30px_rgba(227,24,55,0.4)] hover:shadow-primary/60 flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
            >
              Explore Varieties <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══ USP Marquee ═══ */}
      <section className="w-full py-8 bg-white border-y border-warm-200/50 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-12 px-6"
          >
            {[...USP_ITEMS, ...USP_ITEMS, ...USP_ITEMS, ...USP_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900 uppercase tracking-widest text-sm">
                    {item.title}
                  </h3>
                  <p className="text-warm-500 text-xs font-medium">
                    {item.desc}
                  </p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-warm-300 ml-8" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Categories ═══ */}
      <div id="categories-section" className="scroll-mt-24" />
      <FadeInSection className="max-w-7xl mx-auto w-full py-16 px-4 md:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-warm-900 mb-4">
            Premium Selections
          </h2>
          <p className="text-warm-500 max-w-2xl mx-auto text-sm md:text-base">
            Discover our carefully curated menu, featuring everything from classic stone-baked pizzas to gourmet desserts.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6">
          {categories.map((cat, i) => {
            const IconComponent = cat.icon || Pizza;
            return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Link href={`/menu?category=${cat.id}`} className="block h-full">
                <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-white/80 backdrop-blur-md rounded-3xl cursor-pointer transition-all duration-300 group overflow-hidden border border-warm-200/60 hover:border-primary/40 shadow-sm hover:shadow-[0_24px_48px_-12px_rgba(227,24,55,0.18)]">
                  {/* Subtle background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-warm-50/80 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-[-5deg] group-hover:shadow-[0_12px_24px_-8px_rgba(227,24,55,0.3)] transition-all duration-500 ease-out border border-warm-100 group-hover:border-primary/20 group-hover:bg-white">
                    <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-warm-700 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  <span className="relative z-10 text-sm md:text-base font-bold text-warm-800 text-center group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          )})}
        </div>
      </FadeInSection>

      {/* ═══ Best Sellers ═══ */}
      <FadeInSection className="py-10 md:py-14 bg-warm-100/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-warm-900">
                Most Popular
              </h2>
              <p className="text-warm-500 text-sm mt-1">
                Loved by thousands of pizza fans
              </p>
            </div>
            <Link
              href="/menu"
              className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellers.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <MenuItemCard item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* ═══ CTA Banner ═══ */}
      <FadeInSection className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full py-10">
        <div className="relative bg-gradient-to-r from-primary to-[#b91c1c] rounded-3xl overflow-hidden p-8 md:p-12 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

          <div className="relative z-10 max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Hungry? We&apos;ve got you covered
            </h2>
            <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
              Browse our full menu with 50+ items. From classic pizzas to indulgent
              desserts — there&apos;s something for everyone.
            </p>
            <Link href="/menu">
              <motion.button
                className="bg-white text-primary px-8 py-3.5 rounded-xl font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[var(--shadow-button-hover)] hover:bg-primary hover:text-white transition-all duration-300 group flex items-center gap-2 cursor-pointer"
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -2 }}
                suppressHydrationWarning={true}
              >
                <Search className="w-4 h-4" />
                Explore Menu
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </Link>
          </div>
        </div>
      </FadeInSection>

      {/* ═══ Reviews (Wall of Love Carousel) ═══ */}
      <FadeInSection className="py-16 md:py-24 bg-warm-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-warm-900 mb-3">
                Wall of Love
              </h2>
              <div className="flex items-center gap-2">
               <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-warm-500 font-medium text-xs">
                  Average <span className="text-warm-900 font-bold">4.8/5</span> from 320+ happy foodies
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const container = document.getElementById('reviews-container');
                  if (container) container.scrollBy({ left: -container.offsetWidth / 3, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full bg-white shadow-sm border border-warm-200 flex items-center justify-center text-warm-600 hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
                suppressHydrationWarning={true}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => {
                  const container = document.getElementById('reviews-container');
                  if (container) container.scrollBy({ left: container.offsetWidth / 3, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full bg-white shadow-sm border border-warm-200 flex items-center justify-center text-warm-600 hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
                suppressHydrationWarning={true}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div 
            id="reviews-container"
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 -mx-4 px-4 md:mx-0 md:px-0"
          >
            {REVIEWS.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: i * 0.05, 
                  duration: 0.4
                }}
                className="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-[calc(33.333%-16px)] snap-center relative group bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500"
              >
                {/* Decorative Quote Mark */}
                <div className="absolute top-4 right-8 text-primary/5 group-hover:text-primary/10 transition-colors duration-500">
                  <Quote size={64} fill="currentColor" />
                </div>

                {/* Card Header */}
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent-orange/10 flex items-center justify-center text-primary font-bold text-sm shadow-inner">
                    {review.initial}
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 text-sm">
                      {review.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-warm-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-warm-400 text-[10px] font-medium uppercase tracking-wider">{review.date}</span>
                    </div>
                  </div>
                </div>

                {/* Ordered Item Badge */}
                <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary mb-4">
                  <Pizza size={10} />
                  Ordered: {review.orderedItem}
                </div>

                {/* Content */}
                <p className="relative z-10 text-warm-600 text-sm leading-relaxed italic line-clamp-4 min-h-[5rem]">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Footer / Badge */}
                <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-warm-100/50">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white scale-75">
                    <Star size={10} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Verified Google Review</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
