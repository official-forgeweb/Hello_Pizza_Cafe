"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

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

  return (
    <div className="sticky top-[var(--header-height)] z-40 glass bg-white/70 border-b border-white">
      <div className="relative max-w-7xl mx-auto">
        {/* Left fade */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
        )}

        {/* Right fade */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide gap-1.5 px-4 py-3"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                data-category={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                suppressHydrationWarning={true}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer 
                  hover:-translate-y-0.5 ${
                  isActive
                    ? "text-white shadow-[0_4px_16px_rgba(227,24,55,0.4)]"
                    : "bg-white/80 border border-white text-warm-600 hover:bg-white hover:text-warm-900 hover:shadow-sm"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-primary rounded-full -z-0"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 tracking-wide">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
