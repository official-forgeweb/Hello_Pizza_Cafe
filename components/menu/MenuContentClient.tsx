"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CategoryTabs from "@/components/menu/CategoryTabs";
import MenuItemCard, { type MenuItemData } from "@/components/menu/MenuItemCard";
import ItemCustomizationModal from "@/components/menu/ItemCustomizationModal";
import { useSearchParams } from "next/navigation";

interface MenuContentClientProps {
  initialCategories: any[];
  initialMenuItems: any[];
}

export default function MenuContentClient({ initialCategories, initialMenuItems }: MenuContentClientProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const focusParam = searchParams.get("focus") === "true";
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [showFilters, setShowFilters] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [itemToCustomize, setItemToCustomize] = useState<MenuItemData | null>(null);

  // Sync searchQuery with URL q param on mount (if header search was used)
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  // Handle automatic focus from header search trigger
  useEffect(() => {
    if (focusParam && inputRef.current) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [focusParam]);

  // ─── Filter items ───
  const filteredItems = initialMenuItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // ─── Group items by category ───
  const groupedItems = initialCategories.filter((c) => c.id !== "all").map(
    (cat) => {
      const items = filteredItems.filter((item) => 
        item.categoryId === cat.id || item.categoryId === cat.slug
      );
      return { category: cat, items, totalCount: items.length };
    }
  ).filter(g => g.items.length > 0);

  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Handle category click → scroll ───
  const handleCategoryClick = useCallback((catId: string) => {
    setActiveCategory(catId);
    isScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
      return;
    }
    
    const section = sectionRefs.current.get(catId);
    if (section) {
      const headerOffset = 64 + 52 + 16; // header + tabs + gap
      const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
      
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  }, []);

  // ─── Scroll Spy for Active Category Tab ───
  useEffect(() => {
    if (initialMenuItems.length === 0) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const headerOffset = 64 + 52 + 40; // header height + tabs height + safety margin
      
      // If we are at the very top of the page, highlight "all"
      if (window.scrollY < 100) {
        setActiveCategory("all");
        return;
      }

      // If we've scrolled to the bottom of the page, highlight the last category
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 80) {
        const visibleGroups = groupedItems.filter(g => g.items.length > 0);
        if (visibleGroups.length > 0) {
          setActiveCategory(visibleGroups[visibleGroups.length - 1].category.id);
          return;
        }
      }

      let currentActive = "all";
      let maxTop = -Infinity;

      sectionRefs.current.forEach((el, catId) => {
        const rect = el.getBoundingClientRect();
        // Check if the section's top is past the headerOffset line
        if (rect.top <= headerOffset) {
          // Find the one closest to the headerOffset
          if (rect.top > maxTop) {
            maxTop = rect.top;
            currentActive = catId;
          }
        }
      });

      if (currentActive !== "all" && currentActive !== activeCategory) {
        setActiveCategory(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on load
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [initialMenuItems, groupedItems, activeCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0">
      {/* ─── Search Bar ─── */}
      <div className="bg-white border-b border-warm-200/50 relative z-[45]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="menu-search-input"
                ref={inputRef}
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

        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <CategoryTabs
        categories={[{ id: "all", name: "All" }, ...groupedItems.map(g => g.category)]}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryClick}
      />

      {/* ─── Menu Items ─── */}
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
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
                  if (el) {
                    sectionRefs.current.set(category.id, el);
                  } else {
                    sectionRefs.current.delete(category.id);
                  }
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
