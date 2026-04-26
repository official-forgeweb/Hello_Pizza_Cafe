"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import CategoryTabs from "@/components/menu/CategoryTabs";
import MenuItemCard, { type MenuItemData } from "@/components/menu/MenuItemCard";
import VegBadge from "@/components/menu/VegBadge";
import ItemCustomizationModal from "@/components/menu/ItemCustomizationModal";

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
  const [itemToCustomize, setItemToCustomize] = useState<MenuItemData | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/menu-items?limit=500")
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          if (Array.isArray(cats) && cats.length > 0) {
            setCategories([{ id: "all", name: "All" }, ...cats]);
          }
        }
        if (itemRes.ok) {
          const data = await itemRes.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            // Deduplicate items just in case the backend returns duplicate IDs
            const uniqueMap = new Map();
            data.items.forEach((i: any) => {
              if (!uniqueMap.has(i.id)) uniqueMap.set(i.id, i);
            });
            
            setMenuItems(Array.from(uniqueMap.values()).map((i: any) => ({
              ...i,
              price: Number(i.basePrice || i.price),
              isVeg: i.itemType === "VEG" || i.isVeg === true
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Sync searchQuery with URL q param on mount (if header search was used)
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  // ─── Filter items ───
  const filteredItems = menuItems.filter((item) => {
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

  // ─── Pagination for rendering performance ───
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, vegFilter, activeCategory]);

  // Auto-load 10 more items every 3 seconds until all items are loaded
  useEffect(() => {
    if (visibleCount < filteredItems.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 10);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, filteredItems.length]);

  // ─── Group items by category ───
  const groupedItemsAll = categories.filter((c) => c.id !== "all").map(
    (cat) => {
      const items = filteredItems.filter((item) => 
        item.categoryId === cat.id || item.categoryId === cat.slug
      );
      return { category: cat, items, totalCount: items.length };
    }
  ).filter(g => g.items.length > 0);

  let currentRendered = 0;
  const groupedItems = groupedItemsAll.map(group => {
    if (currentRendered >= visibleCount) return { ...group, items: [] };
    const remaining = visibleCount - currentRendered;
    const displayItems = group.items.slice(0, remaining);
    currentRendered += displayItems.length;
    return { ...group, items: displayItems };
  }).filter(g => g.items.length > 0);

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
        categories={[{ id: "all", name: "All" }, ...groupedItemsAll.map(g => g.category)]}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryClick}
      />

      {/* ─── Menu Items ─── */}
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-10">
            {/* Loading skeleton */}
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-8 bg-warm-100 rounded-lg w-48 mx-auto mb-6 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {[1, 2, 3, 4].map((card) => (
                    <div key={card} className="rounded-2xl overflow-hidden bg-warm-50 animate-pulse">
                      <div className="w-full aspect-[4/3] bg-warm-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-warm-200 rounded w-3/4" />
                        <div className="h-3 bg-warm-100 rounded w-full" />
                        <div className="h-3 bg-warm-100 rounded w-1/2" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-6 bg-warm-200 rounded w-16" />
                          <div className="h-8 bg-warm-200 rounded-lg w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center w-full">
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
          <div className="space-y-8 md:space-y-16 w-full">
            {groupedItems.map(({ category, items, totalCount }: { category: any, items: any[], totalCount: number }) => (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(category.id, el);
                }}
                className="w-full"
              >
                <h2 className="text-xl md:text-3xl font-bold text-warm-900 mb-4 md:mb-10 flex items-center justify-center gap-3 text-center px-4">
                  <span className="h-px bg-warm-200 flex-1 hidden md:block"></span>
                  <span className="shrink-0">{category.name}</span>
                  <span className="text-warm-400 text-[10px] md:text-sm font-medium bg-warm-50 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-warm-200/50 shrink-0">
                    {totalCount} Items
                  </span>
                  <span className="h-px bg-warm-200 flex-1 hidden md:block"></span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                  {items.map((item: any, index: number) => (
                    <div
                      key={`${category.id}-${item.id}-${index}`}
                      className="w-full h-full"
                    >
                      <MenuItemCard item={item} onCustomize={(item) => setItemToCustomize(item)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {visibleCount < filteredItems.length && (
              <div className="flex justify-center pt-8 pb-12 w-full">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg transition-all duration-300 font-bold px-8 py-3 rounded-xl flex items-center gap-2 cursor-pointer group"
                >
                  <Loader2 className="w-5 h-5 group-hover:animate-spin" />
                  Load More Items ({filteredItems.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ItemCustomizationModal
        item={itemToCustomize}
        onClose={() => setItemToCustomize(null)}
      />
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
