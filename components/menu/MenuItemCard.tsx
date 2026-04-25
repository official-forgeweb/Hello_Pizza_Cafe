"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Minus, Star, Pizza } from "lucide-react";
import VegBadge from "./VegBadge";
import { useCartStore, type CartItem } from "@/store/cart";
import { useState, useEffect } from "react";

export interface MenuItemData {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isBestSeller?: boolean;
  hasVariants?: boolean;
  categoryId?: string;
  preparationTime?: string;
  spiciness?: "mild" | "medium" | "hot";
  variants?: Array<{
    id: string;
    name: string;
    priceModifier: number;
    isDefault?: boolean;
  }>;
  addOns?: Array<{
    id: string;
    addonGroup?: string;
    variantName?: string | null;
    addOn: {
      id: string;
      name: string;
      price: number;
    }
  }>;
}

interface MenuItemCardProps {
  item: MenuItemData;
  onCustomize?: (item: MenuItemData) => void;
}

export default function MenuItemCard({ item, onCustomize }: MenuItemCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  
  // Only re-render if THIS specific item's quantity changes
  const totalQtyFromStore = useCartStore((state) => 
    state.items.reduce((sum, ci) => ci.menuItemId === item.id ? sum + ci.quantity : sum, 0)
  );

  const firstCartItem = useCartStore((state) => 
    state.items.find((ci) => ci.menuItemId === item.id)
  );

  const cartItemCount = useCartStore((state) => 
    state.items.reduce((count, ci) => ci.menuItemId === item.id ? count + 1 : count, 0)
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalQty = isMounted ? totalQtyFromStore : 0;

  const handleAdd = () => {
    const hasCustomizations = item.hasVariants || (item.addOns && item.addOns.length > 0) || (item.variants && item.variants.length > 0);
    if (hasCustomizations && onCustomize) {
      onCustomize(item);
      return;
    }

    const newItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      categoryId: item.categoryId,
      totalPrice: item.price,
    };
    addItem(newItem);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemCount === 1 && !item.hasVariants && firstCartItem) {
      updateQuantity(firstCartItem.id, firstCartItem.quantity + 1);
    } else {
      if (onCustomize) onCustomize(item);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemCount === 1 && firstCartItem) {
      if (firstCartItem.quantity > 1) {
        updateQuantity(firstCartItem.id, firstCartItem.quantity - 1);
      } else {
        removeItem(firstCartItem.id);
      }
    } else {
      if (onCustomize) onCustomize(item);
    }
  };

  // Mocking original price and discount for the "deal layout"
  const originalPrice = item.price + Math.floor(item.price * 0.25);
  const discountAmount = originalPrice - item.price;

  return (
    <>
      {/* ─── Mobile View: Horizontal Banner Layout ─── */}
      <div className="md:hidden relative w-full h-[280px] rounded-[16px] overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 bg-gray-900 flex">
        {/* Background Image */}
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            loading="lazy"
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            className="group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-warm-200 flex items-center justify-center text-warm-400">
            <Pizza className="w-16 h-16" strokeWidth={1} />
          </div>
        )}

        {/* Dark Gradient Overlay - Vertical for bottom-aligned content */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.2) 100%)' }}
        />

        {/* Content Container */}
        <div className="relative w-full p-3.5 sm:p-5 flex flex-col justify-between z-10 h-full">
          {/* Top Section: Tags only */}
          <div className="flex items-center gap-2">
            <VegBadge isVeg={item.isVeg} size="sm" />
            {item.isBestSeller && (
              <div className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider">
                <Star className="w-3 h-3 fill-white" />
                Bestseller
              </div>
            )}
          </div>

          {/* Bottom Section: Name + Pricing + ADD Button */}
          <div className="flex flex-col gap-1.5 mt-auto">
            {/* Item Name - Now at the bottom */}
            <h3 className="font-bold text-white text-[18px] sm:text-[22px] leading-tight drop-shadow-lg tracking-tight line-clamp-2">
              {item.name}
            </h3>

            <div className="flex items-end justify-between gap-1.5 mt-1">
              {/* Left: Pricing */}
              <div className="flex flex-col gap-1 shrink">
                <div className="flex items-center gap-1.5 flex-wrap flex-row">
                  <span className="font-bold text-white text-[18px] sm:text-[22px] leading-none bg-black/40 px-1.5 py-1 rounded drop-shadow-lg">₹{item.price}</span>
                  <span className="text-gray-300 text-[11px] sm:text-sm line-through font-medium leading-none drop-shadow-md">₹{originalPrice}</span>
                </div>
                <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded w-fit drop-shadow-md">
                  SAVE ₹{discountAmount}
                </span>
              </div>

              {/* Right: ADD Button Area */}
              <div className="flex flex-col items-end shrink-0">
                {((item.hasVariants) || (item.addOns && item.addOns.length > 0) || (item.variants && item.variants.length > 0)) && (
                  <div className="text-white/95 text-[8px] sm:text-[10px] font-bold mb-1 text-right w-full uppercase tracking-wider drop-shadow-md">
                    Customisable
                  </div>
                )}
              
              {totalQty === 0 ? (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#E31837] text-white px-3.5 sm:px-6 py-2 sm:py-3 rounded-[8px] sm:rounded-[12px] text-[13px] sm:text-[15px] font-extrabold shadow-xl hover:bg-[#C8102E] active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-2 border border-white/10"
                  suppressHydrationWarning={true}
                >
                  ADD <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={3} />
                </motion.button>
              ) : (
                <div
                  className="flex items-center justify-between bg-white rounded-[8px] sm:rounded-[12px] p-1 sm:p-2 shadow-2xl border border-gray-100 h-[36px] sm:h-[52px] min-w-[70px] sm:min-w-[100px]"
                  suppressHydrationWarning={true}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={handleDecrement} className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center text-[#E31837] active:scale-90 cursor-pointer rounded-[6px] sm:rounded-[8px] hover:bg-gray-100 transition-colors" suppressHydrationWarning={true}>
                    <Minus className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={3} />
                  </button>
                  <span className="flex-1 px-1.5 text-center text-[13px] sm:text-[16px] font-extrabold text-[#E31837]" suppressHydrationWarning={true}>{totalQty}</span>
                  <button onClick={handleIncrement} className="w-6 h-6 sm:w-10 sm:h-10 flex items-center justify-center bg-[#E31837] text-white active:scale-90 cursor-pointer rounded-[6px] sm:rounded-[8px] hover:bg-[#C8102E] transition-colors shadow-lg" suppressHydrationWarning={true}>
                    <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={3} />
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Desktop View: Compact Grid Card Layout ─── */}
      <div className="hidden md:flex flex-col w-full h-full bg-white rounded-[16px] overflow-hidden border border-warm-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative">
        {/* Top Image Section - Fixed aspect ratio */}
        <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-warm-50 flex items-center justify-center text-warm-300">
              <Pizza className="w-10 h-10" strokeWidth={1} />
            </div>
          )}
          
          {/* Tags layer */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {item.isBestSeller && (
              <div className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm flex items-center gap-1 uppercase tracking-wider">
                <Star className="w-3 h-3 fill-white" /> Bestseller
              </div>
            )}
            <div className="w-fit bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
              <VegBadge isVeg={item.isVeg} size="sm" />
            </div>
          </div>

          <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm z-10">
            SAVE ₹{discountAmount}
          </div>
        </div>

        {/* Bottom Content Section */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-warm-900 text-sm lg:text-base leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {item.name}
          </h3>

          <p className="text-warm-500 text-xs line-clamp-2 mb-3 leading-relaxed min-h-[2rem]">
            {item.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-lg lg:text-xl font-black text-warm-900 shrink-0">₹{item.price}</span>
              <span className="text-[11px] text-warm-400 line-through font-medium truncate">₹{originalPrice}</span>
            </div>

            {totalQty === 0 ? (
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-5 py-2 rounded-xl text-sm font-extrabold transition-all border border-primary/20 hover:border-primary shadow-sm flex flex-col items-center justify-center shrink-0 min-w-[80px]"
                suppressHydrationWarning={true}
              >
                <div className="flex items-center gap-1.5">
                  ADD <Plus className="w-4 h-4" strokeWidth={2.5} />
                </div>
                {((item.hasVariants) || (item.addOns && item.addOns.length > 0) || (item.variants && item.variants.length > 0)) && <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mt-0.5">Customisable</span>}
              </motion.button>
            ) : (
              <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleDecrement} className="w-7 h-7 flex items-center justify-center text-[#E31837] hover:bg-white rounded-md transition-all"><Minus className="w-3.5 h-3.5" strokeWidth={3} /></button>
                <span className="w-6 text-center text-xs font-bold text-[#E31837]">{totalQty}</span>
                <button onClick={handleIncrement} className="w-7 h-7 flex items-center justify-center bg-[#E31837] text-white rounded-md shadow-sm"><Plus className="w-3.5 h-3.5" strokeWidth={3} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
