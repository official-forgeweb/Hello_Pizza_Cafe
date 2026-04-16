"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Pizza, ShoppingBag } from "lucide-react";
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
  
  const getConfig = () => {
    if (!item) return CONFIG["default"];
    return CONFIG[item.categoryId as keyof typeof CONFIG] || CONFIG["default"];
  };

  const { variants, addons } = getConfig();
  
  // States
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<typeof addons>([]);
  
  // Reset selection when item changes
  useEffect(() => {
    if (item) {
      const conf = getConfig();
      setSelectedVariant(conf.variants[0] || null);
      setSelectedAddons([]);
    }
  }, [item]);

  if (!item) return null;

  const toggleAddon = (addon: typeof addons[0]) => {
    setSelectedAddons((prev) => 
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    const newItem: CartItem = {
      id: `${item.id}-${selectedVariant?.id || 'base'}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price,
      } : undefined,
      addOns: selectedAddons.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      totalPrice: item.price + (selectedVariant?.price || 0) + selectedAddons.reduce((acc, a) => acc + a.price, 0),
    };
    
    addItem(newItem);
    onClose();
  };

  const calculateTotal = () => {
    const base = item.price;
    const vPrice = selectedVariant?.price || 0;
    const aPrice = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    return base + vPrice + aPrice;
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
                          {isSelected && (
                            <motion.div 
                              layoutId="active-variant-border"
                              className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
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
                  <div className="sticky top-0 bg-white py-3 -mx-6 px-6 z-20 border-b border-warm-100/50 flex items-center justify-between mb-4 shadow-sm">
                    <h3 className="font-bold text-warm-900">Add Extras</h3>
                    <span className="text-[10px] sm:text-xs font-bold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addons.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`relative flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 shadow-sm"
                              : "border-warm-200 bg-white hover:border-amber-500/40 hover:bg-warm-50/50"
                          }`}
                        >
                          {isSelected && (
                            <motion.div 
                              layoutId={`addon-bg-${addon.id}`}
                              className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none"
                              initial={false}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          <div className="flex items-center gap-3 z-10">
                            <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all ${
                              isSelected ? "bg-amber-500 border-amber-500 scale-110" : "border-warm-300 bg-white"
                            }`}>
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`font-semibold text-sm ${isSelected ? "text-amber-900" : "text-warm-700"}`}>
                              {addon.name}
                            </span>
                          </div>
                          <span className={`font-black text-sm z-10 ${isSelected ? "text-amber-700" : "text-warm-900"}`}>
                            +₹{addon.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
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
