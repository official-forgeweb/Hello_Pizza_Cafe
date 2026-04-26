"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Pizza, ShoppingBag, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useCartStore, type CartItem } from "@/store/cart";
import { MenuItemData } from "./MenuItemCard";

interface ItemCustomizationModalProps {
  item: MenuItemData | null;
  onClose: () => void;
}

// Mock Addons & Variants Config per category
const CONFIG = {
  "veg-pizza": {
    variants: [
      { id: "reg", name: "Regular (Serves 1)", price: 0 },
      { id: "med", name: "Medium (Serves 2)", price: 120 },
      { id: "lrg", name: "Large (Serves 4)", price: 250 },
    ],
    addons: [
      { id: "cheese", name: "Extra Cheese", price: 45 },
      { id: "paneer", name: "Paneer Chunks", price: 40 },
      { id: "mushroom", name: "Fresh Mushroom", price: 35 },
      { id: "jalapeno", name: "Jalapeños", price: 30 },
      { id: "olives", name: "Black Olives", price: 30 },
      { id: "paprika", name: "Red Paprika", price: 30 },
      { id: "corn", name: "Golden Corn", price: 25 },
      { id: "capsicum", name: "Crisp Capsicum", price: 20 },
      { id: "dip", name: "Cheesy Dip", price: 25 },
    ],
  },
  "non-veg-pizza": {
    variants: [
      { id: "reg", name: "Regular (Serves 1)", price: 0 },
      { id: "med", name: "Medium (Serves 2)", price: 140 },
      { id: "lrg", name: "Large (Serves 4)", price: 280 },
    ],
    addons: [
      { id: "cheese", name: "Extra Cheese", price: 45 },
      { id: "tikka", name: "Chicken Tikka", price: 60 },
      { id: "chicken", name: "Extra Chicken Topping", price: 60 },
      { id: "bbq", name: "Barbeque Chicken", price: 55 },
      { id: "sausage", name: "Chicken Sausage", price: 50 },
      { id: "jalapeno", name: "Jalapeños", price: 30 },
      { id: "olives", name: "Black Olives", price: 30 },
      { id: "dip", name: "Cheesy Dip", price: 25 },
    ],
  },
  "burgers": {
    variants: [
      { id: "reg", name: "Regular", price: 0 },
      { id: "dbl", name: "Double Patty", price: 75 },
    ],
    addons: [
      { id: "fries", name: "Add Small Fries", price: 69 },
      { id: "patty", name: "Extra Patty", price: 49 },
      { id: "coke", name: "Coke (250ml)", price: 40 },
      { id: "cheese_slice", name: "Cheese Slice", price: 20 },
      { id: "onion", name: "Caramelized Onions", price: 20 },
      { id: "dip", name: "Spicy Mayo Dip", price: 20 },
      { id: "lettuce", name: "Extra Lettuce & Tomato", price: 15 },
    ],
  },
  "beverages": {
    variants: [
      { id: "reg", name: "Regular (300ml)", price: 0 },
      { id: "lrg", name: "Large (500ml)", price: 40 },
    ],
    addons: [
      { id: "vanilla", name: "Vanilla Scoop", price: 40 },
      { id: "strawberry", name: "Strawberry Flavor Shot", price: 25 },
      { id: "mint", name: "Mint Leaves", price: 15 },
      { id: "lemon", name: "Lemon Slice", price: 10 },
      { id: "ice", name: "Extra Ice", price: 0 },
    ],
  },
  "sides": {
    variants: [
      { id: "reg", name: "Regular", price: 0 },
      { id: "lrg", name: "Large", price: 50 },
    ],
    addons: [
      { id: "tandoori", name: "Tandoori Dip", price: 25 },
      { id: "dip", name: "Cheesy Dip", price: 25 },
      { id: "mayo", name: "Extra Mayo", price: 20 },
      { id: "chilli", name: "Sweet Chilli Sauce", price: 20 },
      { id: "peri", name: "Peri Peri Sprinkle", price: 15 },
    ],
  },
  "pasta": {
    variants: [
      { id: "reg", name: "Regular Portion", price: 0 },
      { id: "lrg", name: "Large Portion", price: 80 },
    ],
    addons: [
      { id: "bread", name: "Garlic Bread (2 pcs)", price: 60 },
      { id: "chicken", name: "Roasted Chicken", price: 50 },
      { id: "cheese", name: "Extra Cheese", price: 40 },
      { id: "mushroom", name: "Fresh Mushroom", price: 35 },
      { id: "olives", name: "Black Olives", price: 30 },
    ],
  },
  // Default fallback for desserts, combos, etc.
  "default": {
    variants: [],
    addons: [],
  }
};

export default function ItemCustomizationModal({ item, onClose }: ItemCustomizationModalProps) {
  const { addItem } = useCartStore();
  
  const getActualOptions = () => {
    if (!item) return { variants: [], addons: [] };

    const dbVariants = item.variants?.map(v => ({
      id: v.id,
      name: v.name,
      price: Number(v.priceModifier) || 0,
      isDefault: v.isDefault
    })) || [];

    const dbAddons = item.addOns?.map(a => ({
      id: a.addOn.id,
      name: a.addOn.name,
      price: Number(a.addOn.price) || 0,
      addonGroup: a.addonGroup || "Extras",
      variantName: a.variantName || null
    })) || [];

    // If DB has custom options, use them. Otherwise fallback to mock CONFIG.
    if (dbVariants.length > 0 || dbAddons.length > 0) {
      return { variants: dbVariants, addons: dbAddons };
    }

    const mockConfig = CONFIG[item.categoryId as keyof typeof CONFIG] || CONFIG["default"];
    return {
      variants: mockConfig.variants,
      addons: mockConfig.addons.map(a => ({
        ...a,
        addonGroup: (a as any).addonGroup || "Extras",
        variantName: (a as any).variantName || null
      }))
    };
  };

  const { variants, addons } = getActualOptions();
  
  // States
  const [selectedVariant, setSelectedVariant] = useState<typeof variants[0] | null>(variants.find(v => (v as any).isDefault) || variants[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<(typeof addons[0] & { quantity: number })[]>([]);
  
  // Reset selection when item changes
  useEffect(() => {
    if (item) {
      const opts = getActualOptions();
      setSelectedVariant(opts.variants.find(v => (v as any).isDefault) || opts.variants[0] || null);
      setSelectedAddons([]);
    }
  }, [item]);

  if (!item) return null;

  const incrementAddon = (addon: typeof addons[0]) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.id === addon.id);
      if (existing) {
        return prev.map((a) => 
          a.id === addon.id ? { ...a, quantity: a.quantity + 1 } : a
        );
      }
      return [...prev, { ...addon, quantity: 1 }];
    });
  };

  const decrementAddon = (addon: typeof addons[0]) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.id === addon.id);
      if (existing && existing.quantity > 1) {
        return prev.map((a) => 
          a.id === addon.id ? { ...a, quantity: a.quantity - 1 } : a
        );
      }
      return prev.filter((a) => a.id !== addon.id);
    });
  };

  const handleAddToCart = () => {
    const newItem: CartItem = {
      id: `${item.id}-${selectedVariant?.id || 'base'}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      categoryId: item.categoryId,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price,
      } : undefined,
      addOns: selectedAddons.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
      })),
      totalPrice: (selectedVariant ? selectedVariant.price : item.price) + selectedAddons.reduce((acc, a) => acc + (a.price * a.quantity), 0),
    };
    
    addItem(newItem);
    onClose();
  };

  const calculateTotal = () => {
    const basePrice = selectedVariant ? selectedVariant.price : item.price;
    const aPrice = selectedAddons.reduce((acc, a) => acc + (a.price * a.quantity), 0);
    return basePrice + aPrice;
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-3xl z-[101] flex flex-col md:max-w-2xl md:mx-auto shadow-2xl overflow-hidden"
          >
            {/* Handle for mobile */}
            <div className="w-full flex justify-center py-3">
              <div className="w-12 h-1.5 bg-warm-200 rounded-full" />
            </div>

            <div className="absolute top-5 right-5 z-[100]">
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-warm-100 text-warm-600 rounded-full hover:bg-warm-200 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-30 bg-white px-6 pb-4 border-b border-warm-100/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex-shrink-0">
              {/* Header Info */}
              <div className="flex gap-4 mb-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-warm-100 flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 80px, 96px"
                      loading="lazy"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-warm-300">
                      <Pizza className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-lg sm:text-xl font-bold text-warm-900 mb-1 leading-tight line-clamp-1">
                    {item.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-warm-500 line-clamp-2 leading-snug">
                    {item.description}
                  </p>
                  <div className="mt-1.5 text-base sm:text-lg font-black text-primary">
                    ₹{item.price} <span className="text-xs text-warm-400 font-medium">base</span>
                  </div>
                </div>
              </div>

              {/* Variants Selection */}
              {variants.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-warm-900">Choose Size / Variant</h3>
                    <span className="text-xs font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Required</span>
                  </div>
                  <div className={`grid gap-3 ${variants.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      // Split name to highlight the main size and show detail below
                      const nameParts = variant.name.split(" (");
                      const mainName = nameParts[0];
                      const detail = nameParts[1] ? `(${nameParts[1]}` : "";
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-warm-200 bg-white hover:border-primary/40 hover:bg-warm-50"
                          }`}
                        >
                          <div className={`text-sm sm:text-base font-bold z-10 ${isSelected ? "text-primary" : "text-warm-800"}`}>
                            {mainName}
                          </div>
                          {detail && (
                            <div className="text-[10px] sm:text-xs text-warm-500 mt-0.5 z-10 text-center leading-tight">
                              {detail.replace(")", "")}
                            </div>
                          )}
                          <div className={`text-xs font-black mt-2 z-10 ${isSelected ? "text-primary shadow-sm bg-white px-2 py-0.5 rounded-full" : "text-warm-500"}`}>
                            {variant.price > 0 ? `+₹${variant.price}` : "Free"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Addons Selection */}
            <div className="overflow-y-auto flex-1 hide-scrollbar bg-warm-50/20">
              {addons.length > 0 && (
                <div className="px-6 pb-6">
                  {(() => {
                    // Filter addons based on selected variant
                    // Show global addons (variantName is null) AND addons specific to selected variant
                    const availableAddons = addons.filter(a => 
                      !a.variantName || (selectedVariant && a.variantName === selectedVariant.name)
                    );

                    // Group available addons by addonGroup
                    const groupedAddons: Record<string, typeof addons> = {};
                    availableAddons.forEach(addon => {
                      const group = addon.addonGroup || "Extras";
                      if (!groupedAddons[group]) groupedAddons[group] = [];
                      groupedAddons[group].push(addon);
                    });

                    return Object.entries(groupedAddons).map(([groupName, groupAddons]) => (
                      <div key={groupName} className="mb-6 last:mb-0">
                        <div className="sticky top-0 bg-white py-3 -mx-6 px-6 z-20 border-b border-warm-100/50 flex items-center justify-between mb-4 shadow-sm">
                          <h3 className="font-bold text-warm-900">{groupName}</h3>
                          <span className="text-[10px] sm:text-xs font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Optional</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {groupAddons.map((addon) => {
                            const selectedAddon = selectedAddons.find((a) => a.id === addon.id);
                            const isSelected = !!selectedAddon;
                            const quantity = selectedAddon?.quantity || 0;

                            return (
                              <div
                                key={addon.id}
                                onClick={() => !isSelected && incrementAddon(addon)}
                                className={`relative flex flex-col p-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                                  isSelected
                                    ? "border-amber-500 bg-amber-50 shadow-md"
                                    : "border-warm-200 bg-white hover:border-amber-500/40 hover:bg-warm-50/50"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all ${
                                      isSelected ? "bg-amber-500 border-amber-500" : "border-warm-300 bg-white"
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                    </div>
                                    <span className={`font-semibold text-sm ${isSelected ? "text-amber-900" : "text-warm-700"}`}>
                                      {addon.name}
                                    </span>
                                  </div>
                                  <span className={`font-black text-sm ${isSelected ? "text-amber-700" : "text-warm-900"}`}>
                                    +₹{addon.price}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                  {isSelected ? (
                                    <div className="flex items-center bg-white rounded-xl border border-amber-200 p-1 shadow-sm w-full justify-between">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); decrementAddon(addon); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-100 text-warm-600 hover:bg-warm-200 transition-colors"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <div className="flex flex-col items-center px-4">
                                        <span className="text-[10px] text-warm-400 uppercase font-bold leading-none mb-1">Qty</span>
                                        <span className="text-sm font-black text-warm-900 leading-none">{quantity}</span>
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); incrementAddon(addon); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => incrementAddon(addon)}
                                      className="w-full py-2 flex items-center justify-center gap-2 bg-warm-100 text-warm-600 rounded-xl font-bold text-xs hover:bg-warm-200 transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add Extra
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-white border-t border-warm-200 flex-shrink-0 z-20">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-between bg-primary text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs text-primary-100 uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl">₹{calculateTotal()}</span>
                </div>
                <div className="flex items-center gap-2">
                  Add Item
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
