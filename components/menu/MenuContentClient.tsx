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
  initialDiscounts?: any[];
}
function findBestMatch(query: string, items: any[], isItemParam: boolean) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();
  
  // 1. Try exact match
  let match = items.find(item => item.name.toLowerCase().trim() === normalized);
  if (match) return match;
  
  // 2. If it's a specific item parameter (or close match), allow partials
  if (isItemParam) {
    match = items.find(item => normalized.includes(item.name.toLowerCase().trim()));
    if (match) return match;

    match = items.find(item => item.name.toLowerCase().trim().includes(normalized));
    if (match) return match;
  } else {
    // For q=..., only allow if length difference is small (<= 6 chars)
    match = items.find(item => {
      const nameLower = item.name.toLowerCase().trim();
      const isClose = normalized.includes(nameLower) || nameLower.includes(normalized);
      const lenDiff = Math.abs(normalized.length - nameLower.length);
      return isClose && lenDiff <= 6;
    });
    if (match) return match;
  }

  return null;
}

export default function MenuContentClient({ initialCategories, initialMenuItems, initialDiscounts = [] }: MenuContentClientProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const focusParam = searchParams.get("focus") === "true";
  const itemParam = searchParams.get("item") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronously compute initial search and highlight state to avoid layout flashes
  let initialSearch = urlQuery;
  let initialHighlight = "";

  if (initialMenuItems.length > 0) {
    if (itemParam) {
      const matched = findBestMatch(itemParam, initialMenuItems, true);
      if (matched) {
        initialSearch = "";
        initialHighlight = matched.name;
      }
    } else if (urlQuery) {
      const matched = findBestMatch(urlQuery, initialMenuItems, false);
      if (matched) {
        initialSearch = "";
        initialHighlight = matched.name;
      }
    }
  }
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [itemHighlight, setItemHighlight] = useState(initialHighlight);
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [showFilters, setShowFilters] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [itemToCustomize, setItemToCustomize] = useState<MenuItemData | null>(null);

  // Sync searchQuery with URL parameters, clearing filter if matching a specific item name
  useEffect(() => {
    let finalSearch = urlQuery;
    let finalHighlight = "";

    if (initialMenuItems.length > 0) {
      if (itemParam) {
        const matched = findBestMatch(itemParam, initialMenuItems, true);
        if (matched) {
          finalSearch = "";
          finalHighlight = matched.name;
        }
      } else if (urlQuery) {
        const matched = findBestMatch(urlQuery, initialMenuItems, false);
        if (matched) {
          finalSearch = "";
          finalHighlight = matched.name;
        }
      }
    }

    setSearchQuery(finalSearch);
    setItemHighlight(finalHighlight);
  }, [urlQuery, itemParam, initialMenuItems]);

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

  // Handle scrolling to and highlighting a specific item
  useEffect(() => {
    if (itemHighlight && initialMenuItems.length > 0) {
      const normalizedParam = itemHighlight.toLowerCase().trim();
      const targetItem = initialMenuItems.find(
        (item) => item.name.toLowerCase().trim() === normalizedParam || 
                  item.name.toLowerCase().trim().includes(normalizedParam)
      );

      if (targetItem) {
        const timer = setTimeout(() => {
          const element = document.getElementById(`item-${targetItem.id}`);
          if (element) {
            const headerOffset = 64 + 52 + 24; // header + tabs + gap
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });

            // Highlight animation classes
            element.classList.add(
              "ring-4",
              "ring-primary/80",
              "ring-offset-4",
              "scale-[1.03]",
              "shadow-2xl",
              "z-10"
            );
            
            setTimeout(() => {
              element.classList.remove(
                "ring-4",
                "ring-primary/80",
                "ring-offset-4",
                "scale-[1.03]",
                "shadow-2xl",
                "z-10"
              );
            }, 3000);
          }
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [itemHighlight, initialMenuItems]);

  // ─── Category schedule visibility (same logic as POS) ───
  const isCategoryVisible = useCallback((c: any): boolean => {
    if (!c || c.id === "all") return true;
    const now = new Date();
    const day = now.getDay(); // 0=Sunday ... 6=Saturday

    // Check applicable days
    if (c.applicableDays) {
      try {
        const days = typeof c.applicableDays === "string"
          ? JSON.parse(c.applicableDays)
          : c.applicableDays;
        if (Array.isArray(days) && days.length > 0) {
          if (!days.includes(day)) return false;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    // Check time slots (multiple ranges)
    if (c.timeSlots) {
      try {
        const slots = typeof c.timeSlots === "string"
          ? JSON.parse(c.timeSlots)
          : c.timeSlots;
        if (Array.isArray(slots) && slots.length > 0) {
          const isAnySlotActive = slots.some((slot: any) => {
            const start = slot.start || "00:00";
            const end = slot.end || "23:59";
            if (start <= end) {
              return timeStr >= start && timeStr <= end;
            } else {
              // Overnight slot (e.g. 22:00 - 02:00)
              return timeStr >= start || timeStr <= end;
            }
          });
          if (!isAnySlotActive) return false;
        }
      } catch (e) {
        // ignore parse errors
      }
    } else if (c.startTime || c.endTime) {
      // Legacy single time range
      const start = c.startTime || "00:00";
      const end = c.endTime || "23:59";
      if (start <= end) {
        if (timeStr < start || timeStr > end) return false;
      } else {
        if (timeStr < start && timeStr > end) return false;
      }
    }

    return true;
  }, []);

  // Re-evaluate category visibility every 60 seconds so scheduled categories appear/disappear in real-time
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Filter items ───
  const filteredItems = initialMenuItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Find the exact highlighted item
  const highlightedItem = itemHighlight && initialMenuItems.length > 0
    ? initialMenuItems.find(item => item.name.toLowerCase().trim() === itemHighlight.toLowerCase().trim())
    : null;

  // ─── Filter categories by schedule visibility, then group items by category ───
  const visibleCategories = initialCategories.filter((c) => c.id === "all" || isCategoryVisible(c));

  let groupedItems = visibleCategories.filter((c) => c.id !== "all").map(
    (cat) => {
      let items = filteredItems.filter((item) => 
        item.categoryId === cat.id || item.categoryId === cat.slug
      );
      
      // If this category contains the highlighted item, move it to the front of this category's items list
      if (highlightedItem && (highlightedItem.categoryId === cat.id || highlightedItem.categoryId === cat.slug)) {
        const otherItems = items.filter(item => item.id !== highlightedItem.id);
        const matchedInItems = items.find(item => item.id === highlightedItem.id);
        if (matchedInItems) {
          items = [matchedInItems, ...otherItems];
        }
      }

      return { category: cat, items, totalCount: items.length };
    }
  ).filter(g => g.items.length > 0);

  // If there is a highlighted item, move its category to the very front of groupedItems
  if (highlightedItem) {
    const targetCatIndex = groupedItems.findIndex(g => 
      g.category.id === highlightedItem.categoryId || g.category.slug === highlightedItem.categoryId
    );
    if (targetCatIndex > 0) {
      const targetGroup = groupedItems[targetCatIndex];
      const otherGroups = groupedItems.filter((_, idx) => idx !== targetCatIndex);
      groupedItems = [targetGroup, ...otherGroups];
    }
  }

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
                      id={`item-${item.id}`}
                      className="w-full h-full transition-all duration-700 ease-out"
                    >
                       <MenuItemCard item={item} activeDiscounts={initialDiscounts} onCustomize={(item) => setItemToCustomize(item)} />
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
        activeDiscounts={initialDiscounts}
        onClose={() => setItemToCustomize(null)}
      />
    </div>
  );
}
