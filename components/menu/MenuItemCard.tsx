"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Minus, Star, Pizza, Info, Clock, Flame } from "lucide-react";
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
  const [justAdded, setJustAdded] = useState(false);
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
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
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

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-warm-200 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-warm-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-300">
            <Pizza className="w-12 h-12" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <VegBadge isVeg={item.isVeg} size="sm" />
          {item.isBestSeller && (
            <div className="bg-amber-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
              Bestseller
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-bold text-warm-900 text-lg leading-tight line-clamp-1">
            {item.name}
          </h3>
          <Info className="w-4 h-4 text-warm-300 cursor-help flex-shrink-0 mt-1" />
        </div>

        {item.description && (
          <p className="text-xs text-warm-500 line-clamp-2 mb-3 h-8 leading-snug">
            {item.description}
          </p>
        )}

        {/* Item Info Tags */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1 text-warm-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">15-20m</span>
          </div>
          {item.spiciness !== "mild" && (
            <div className={`flex items-center gap-1 ${item.spiciness === "hot" ? "text-primary" : "text-amber-600"}`}>
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{item.spiciness || "med"}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-warm-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold">4.8</span>
          </div>
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-warm-100">
          <span className="text-xl font-black text-warm-900">₹{item.price}</span>

          {totalQty === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              suppressHydrationWarning={true}
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-warm-100 rounded-xl p-1" suppressHydrationWarning={true}>
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center text-warm-600 active:scale-90 cursor-pointer"
                suppressHydrationWarning={true}
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
              <span className="w-6 text-center text-sm font-black text-warm-900" suppressHydrationWarning={true}>
                {totalQty}
              </span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-warm-600 active:scale-90 cursor-pointer"
                suppressHydrationWarning={true}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

