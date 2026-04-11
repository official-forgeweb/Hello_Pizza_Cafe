"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CategoryTabs from "@/components/menu/CategoryTabs";
import MenuItemCard, { type MenuItemData } from "@/components/menu/MenuItemCard";
import VegBadge from "@/components/menu/VegBadge";

// ─── Mock Data ────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "veg-pizza", name: "Veg Pizza" },
  { id: "nonveg-pizza", name: "Non-Veg Pizza" },
  { id: "burgers", name: "Burgers" },
  { id: "sides", name: "Sides" },
  { id: "beverages", name: "Beverages" },
  { id: "desserts", name: "Desserts" },
];

const MENU_ITEMS: (MenuItemData & { categoryId: string })[] = [
  // Veg Pizza
  {
    id: "m1",
    name: "Margherita Classica",
    description: "San Marzano tomatoes, fresh mozzarella, aromatic basil leaves on a hand-tossed base",
    price: 299,
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    isBestSeller: true,
    categoryId: "veg-pizza",
    hasVariants: true,
  },
  {
    id: "m2",
    name: "Farmhouse Supreme",
    description: "Capsicum, onion, tomato, mushroom, sweet corn with Italian herb seasoning",
    price: 389,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "veg-pizza",
    hasVariants: true,
  },
  {
    id: "m3",
    name: "Paneer Tikka Pizza",
    description: "Tandoori paneer, bell peppers, onions with mint chutney drizzle",
    price: 429,
    imageUrl: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    isBestSeller: true,
    categoryId: "veg-pizza",
    hasVariants: true,
  },
  {
    id: "m4",
    name: "Mexican Green Wave",
    description: "Jalapeños, capsicum, olives, onions with a spicy Mexican salsa base",
    price: 399,
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "veg-pizza",
    hasVariants: true,
  },
  // Non-Veg Pizza
  {
    id: "m5",
    name: "Pepperoni Overload",
    description: "Double pepperoni, mozzarella, red onions, and chili flakes",
    price: 449,
    imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    isBestSeller: true,
    categoryId: "nonveg-pizza",
    hasVariants: true,
  },
  {
    id: "m6",
    name: "BBQ Chicken Supreme",
    description: "Smoky BBQ chicken, caramelized onions, jalapeños, cheddar cheese blend",
    price: 499,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    categoryId: "nonveg-pizza",
    hasVariants: true,
  },
  {
    id: "m7",
    name: "Chicken Tikka Pizza",
    description: "Tandoori chicken tikka pieces, onions, capsicum with creamy tikka sauce",
    price: 479,
    imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    isBestSeller: true,
    categoryId: "nonveg-pizza",
    hasVariants: true,
  },
  {
    id: "m8",
    name: "Meat Feast",
    description: "Pepperoni, chicken sausage, BBQ chicken, ground beef — the ultimate meat lover's dream",
    price: 599,
    imageUrl: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    categoryId: "nonveg-pizza",
    hasVariants: true,
  },
  // Burgers
  {
    id: "m9",
    name: "Classic Veg Burger",
    description: "Crispy veggie patty, lettuce, tomato, cheese, special sauce",
    price: 149,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "burgers",
  },
  {
    id: "m10",
    name: "Chicken Zinger",
    description: "Spicy crispy chicken fillet, coleslaw, mayo, toasted sesame bun",
    price: 199,
    imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    isBestSeller: true,
    categoryId: "burgers",
  },
  // Sides
  {
    id: "m11",
    name: "Garlic Bread (4 pcs)",
    description: "Toasted bread with garlic butter and herbs, served with marinara dip",
    price: 129,
    imageUrl: "https://images.unsplash.com/photo-1619531040576-f9416b97c9af?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "sides",
  },
  {
    id: "m12",
    name: "Loaded Fries",
    description: "Crispy fries topped with cheese sauce, jalapeños, and sour cream",
    price: 159,
    imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20aeb56983?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "sides",
  },
  {
    id: "m13",
    name: "Chicken Wings (6 pcs)",
    description: "Crispy fried wings tossed in your choice of sauce — peri-peri, BBQ, or buffalo",
    price: 249,
    imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: false,
    categoryId: "sides",
  },
  // Beverages
  {
    id: "m14",
    name: "Coca-Cola (500ml)",
    description: "Chilled classic Coca-Cola",
    price: 60,
    imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "beverages",
  },
  {
    id: "m15",
    name: "Fresh Lemonade",
    description: "Freshly squeezed lemon with mint and a hint of ginger",
    price: 89,
    imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "beverages",
  },
  // Desserts
  {
    id: "m16",
    name: "Choco Lava Cake",
    description: "Warm chocolate cake with a molten lava center, served with vanilla ice cream",
    price: 179,
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    isBestSeller: true,
    categoryId: "desserts",
  },
  {
    id: "m17",
    name: "New York Cheesecake",
    description: "Creamy baked cheesecake with a buttery graham cracker crust",
    price: 199,
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600&h=450",
    isVeg: true,
    categoryId: "desserts",
  },
];

// ─── Page Component ───────────────────────────────────────────
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Menu Content Implementation ─────────────────────────────
function MenuContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [showFilters, setShowFilters] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync searchQuery with URL q param on mount (if header search was used)
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  // ─── Filter items ───
  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg =
      vegFilter === "all" ||
      (vegFilter === "veg" && item.isVeg) ||
      (vegFilter === "nonveg" && !item.isVeg);
    return matchesSearch && matchesVeg;
  });

  // ─── Group items by category ───
  const groupedItems = CATEGORIES.filter((c) => c.id !== "all").reduce(
    (acc, cat) => {
      const items = filteredItems.filter((item) => item.categoryId === cat.id);
      if (items.length > 0) {
        acc.push({ category: cat, items });
      }
      return acc;
    },
    [] as { category: (typeof CATEGORIES)[0]; items: typeof filteredItems }[]
  );

  // ─── Handle category click → scroll ───
  const handleCategoryClick = useCallback((catId: string) => {
    setActiveCategory(catId);
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const section = sectionRefs.current.get(catId);
    if (section) {
      const headerOffset = 64 + 52 + 16; // header + tabs + gap
      const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  // ─── Intersection Observer for scroll-sync ───
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, catId) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
              setActiveCategory(catId);
            }
          });
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0.2 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [searchQuery, vegFilter]);

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0">
      {/* ─── Search Bar ─── */}
      <div className="bg-white border-b border-warm-200/50 relative z-[45]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="text"
                placeholder="Search for pizza, burgers, desserts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-400 border-0"
                suppressHydrationWarning={true}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  <X className="w-4 h-4 text-warm-400 hover:text-warm-600" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                showFilters || vegFilter !== "all"
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : "bg-warm-100 border-transparent text-warm-500"
              }`}
              whileTap={{ scale: 0.95 }}
              suppressHydrationWarning={true}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Veg/Non-veg Filter */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-3">
                  <span className="text-xs font-medium text-warm-500 mr-1">Type:</span>
                  {[
                    { value: "all" as const, label: "All" },
                    { value: "veg" as const, label: "Veg" },
                    { value: "nonveg" as const, label: "Non-Veg" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setVegFilter(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        vegFilter === opt.value
                          ? "bg-primary text-white"
                          : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                      }`}
                      suppressHydrationWarning={true}
                    >
                      {opt.value === "veg" && <VegBadge isVeg={true} size="sm" />}
                      {opt.value === "nonveg" && <VegBadge isVeg={false} size="sm" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <CategoryTabs
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryClick}
      />

      {/* ─── Menu Items ─── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4 text-warm-400">
              <Search className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-warm-800 mb-1">
              No items found
            </h3>
            <p className="text-warm-500 text-sm">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setVegFilter("all");
                setActiveCategory("all");
              }}
              className="mt-4 text-primary font-semibold text-sm hover:underline cursor-pointer"
              suppressHydrationWarning={true}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* All categories grouped */
          <div className="space-y-10">
            {groupedItems.map(({ category, items }) => (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(category.id, el);
                }}
              >
                <h2 className="text-lg md:text-xl font-bold text-warm-900 mb-4 flex items-center gap-2">
                  {category.name}
                  <span className="text-warm-400 text-sm font-normal">
                    ({items.length})
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MenuItemCard item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Exposed with Suspense ────────────────────────
export default function MenuPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-warm-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
