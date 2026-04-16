"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Pizza, 
  Flame, 
  Utensils, 
  Coffee, 
  IceCream, 
  PartyPopper,
  Sandwich,
  Beef,
  LayoutGrid
} from "lucide-react";

interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  "all": LayoutGrid,
  "veg": Pizza,
  "non-veg": Beef,
  "burgers": Sandwich,
  "sides": Flame,
  "beverages": Coffee,
  "desserts": IceCream,
  "combos": PartyPopper,
  "default": Utensils
};

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 8);
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    handleScroll();
  }, [categories]);

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeTab = scrollRef.current.querySelector(`[data-category="${activeCategory}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  const getIcon = (name: string) => {
    const key = name.toLowerCase();
    for (const [iconKey, Icon] of Object.entries(CATEGORY_ICONS)) {
      if (key.includes(iconKey)) return Icon;
    }
    return CATEGORY_ICONS.default;
  };

  return (
    <div className="sticky top-[var(--header-height)] z-40 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
      <div className="relative max-w-7xl mx-auto py-1">
        {/* Left fade */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/90 via-white/40 to-transparent z-10 pointer-events-none" />
        )}

        {/* Right fade */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 via-white/40 to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide gap-2 px-4 py-3 md:justify-center"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            const Icon = getIcon(cat.name);
            
            return (
              <button
                key={cat.id}
                data-category={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                suppressHydrationWarning={true}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors duration-300 cursor-pointer flex items-center gap-2 group outline-none
                  ${isActive ? "text-white" : "text-warm-600 hover:text-warm-900"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-primary rounded-full shadow-[0_8px_20px_-6px_rgba(227,24,55,0.45)] ring-4 ring-primary/10"
                    transition={{ 
                      type: "spring", 
                      stiffness: 450, 
                      damping: 32,
                      mass: 0.8
                    }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className="tracking-tight">{cat.name}</span>
                </span>
                
                {!isActive && (
                  <motion.div 
                    className="absolute inset-0 bg-warm-100 rounded-full opacity-0 group-hover:opacity-100 -z-10 transition-opacity"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
