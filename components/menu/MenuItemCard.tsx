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
}

interface MenuItemCardProps {
  item: MenuItemData;
  onCustomize?: (item: MenuItemData) => void;
}

export default function MenuItemCard({ item, onCustomize }: MenuItemCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find all cart items for this menu item
  const cartItems = items.filter((ci) => ci.menuItemId === item.id);
  const totalQty = isMounted ? cartItems.reduce((sum, ci) => sum + ci.quantity, 0) : 0;

  const handleAdd = () => {
    if (item.hasVariants && onCustomize) {
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
      totalPrice: item.price,
    };
    addItem(newItem);
  };

  const handleIncrement = () => {
    if (cartItems.length === 1) {
      updateQuantity(cartItems[0].id, cartItems[0].quantity + 1);
    } else if (item.hasVariants && onCustomize) {
      onCustomize(item);
    } else {
      handleAdd();
    }
  };

  const handleDecrement = () => {
    if (cartItems.length === 1) {
      if (cartItems[0].quantity === 1) {
        removeItem(cartItems[0].id);
      } else {
        updateQuantity(cartItems[0].id, cartItems[0].quantity - 1);
      }
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
        <div className="relative w-full p-5 flex flex-col justify-between z-10 h-full">
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
          <div className="flex flex-col gap-3 mt-auto">
            {/* Item Name - Now at the bottom */}
            <h3 className="font-bold text-white text-[24px] md:text-[26px] leading-tight drop-shadow-lg tracking-tight">
              {item.name}
            </h3>

            <div className="flex items-end justify-between gap-4">
              {/* Left: Pricing */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-[22px] leading-none bg-black/40 px-2 py-1.5 rounded drop-shadow-lg">₹{item.price}</span>
                  <span className="text-gray-300 text-sm line-through font-medium leading-none drop-shadow-md">₹{originalPrice}</span>
                </div>
                <span className="bg-white/25 text-white text-[11px] font-bold px-2.5 py-1 rounded w-fit drop-shadow-md">
                  SAVE ₹{discountAmount}
                </span>
              </div>

              {/* Right: ADD Button Area */}
              <div className="flex flex-col items-end min-w-[120px]">
                {item.hasVariants && (
                  <div className="text-white/95 text-[10px] font-bold mb-2 text-right w-full uppercase tracking-wider drop-shadow-md">
                    Customisable
                  </div>
                )}
              
              {totalQty === 0 ? (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#E31837] text-white px-8 py-3.5 rounded-[12px] text-[15px] font-extrabold shadow-xl hover:bg-[#C8102E] active:scale-95 transition-all w-full flex items-center justify-center gap-2 border border-white/10"
                  suppressHydrationWarning={true}
                >
                  ADD <Plus className="w-5 h-5" strokeWidth={3} />
                </motion.button>
              ) : (
                <div
                  className="flex items-center justify-between bg-white rounded-[12px] p-2 shadow-2xl w-full border border-gray-100 h-[52px]"
                  suppressHydrationWarning={true}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={handleDecrement} className="w-10 h-10 flex items-center justify-center text-[#E31837] active:scale-90 cursor-pointer rounded-[8px] hover:bg-gray-100 transition-colors" suppressHydrationWarning={true}>
                    <Minus className="w-5 h-5" strokeWidth={3} />
                  </button>
                  <span className="flex-1 text-center text-[16px] font-extrabold text-[#E31837]" suppressHydrationWarning={true}>{totalQty}</span>
                  <button onClick={handleIncrement} className="w-10 h-10 flex items-center justify-center bg-[#E31837] text-white active:scale-90 cursor-pointer rounded-[8px] hover:bg-[#C8102E] transition-colors shadow-lg" suppressHydrationWarning={true}>
                    <Plus className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ─── Desktop View: Compact Grid Card Layout ─── */}
      <div className="hidden md:flex flex-col w-full bg-white rounded-[16px] overflow-hidden border border-warm-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative">
        {/* Top Image Section - Compacted height */}
        <div className="relative w-full h-[160px] overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
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

        {/* Bottom Content Section - Compacted padding */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-warm-900 text-base lg:text-lg leading-tight mb-1 group-hover:text-primary transition-colors truncate">
            {item.name}
          </h3>

          <p className="text-warm-500 text-xs line-clamp-2 mb-3 leading-relaxed h-[32px]">
            {item.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="text-lg lg:text-xl font-black text-warm-900">₹{item.price}</span>
              <span className="text-[11px] text-warm-400 line-through font-medium truncate">₹{originalPrice}</span>
            </div>

            {totalQty === 0 ? (
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#E31837] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#C8102E] transition-all whitespace-nowrap"
                suppressHydrationWarning={true}
              >
                ADD <Plus className="w-3.5 h-3.5 ml-0.5 inline-block" strokeWidth={3} />
              </motion.button>
            ) : (
              <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleDecrement} className="w-7 h-7 flex items-center justify-center text-[#E31837] hover:bg-white rounded-md transition-all"><Minus className="w-3.5 h-3.5" strokeWidth={3} /></button>
                <span className="w-6 text-center text-xs font-bold text-[#E31837]">{totalQty}</span>
                <button onClick={handleIncrement} className="w-7 h-7 flex items-center justify-center bg-[#E31837] text-white rounded-md shadow-sm"><Plus className="w-3.5 h-3.5" strokeWidth={3} /></button>
              </div>
            )}
          </div>
          {item.hasVariants && <div className="text-[9px] font-bold text-warm-400 uppercase tracking-widest mt-2">Customisable</div>}
        </div>
      </div>
    </>
  );
}
