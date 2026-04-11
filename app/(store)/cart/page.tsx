"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Minus,
  X,
  ShoppingBag,
  Tag,
  ChevronRight,
  MapPin,
  Check,
  Truck,
  Clock,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import VegBadge from "@/components/menu/VegBadge";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getCartTotal, getCartCount } =
    useCartStore();
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = getCartTotal();
  const count = getCartCount();
  const taxRate = 0.05;
  const deliveryFee = total >= 499 ? 0 : 30;
  const tax = Math.round(total * taxRate);
  const grandTotal = total + tax + deliveryFee - couponDiscount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "HELLO20") {
      const discount = Math.min(Math.round(total * 0.2), 150);
      setCouponDiscount(discount);
      setCouponApplied("HELLO20");
    } else if (couponCode.toUpperCase() === "FIRST50") {
      setCouponDiscount(50);
      setCouponApplied("FIRST50");
    } else {
      setCouponApplied(null);
      setCouponDiscount(0);
    }
  };

  if (count === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Background Decorative Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" 
        />

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          className="relative"
        >
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8 glass relative z-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShoppingBag className="w-14 h-14 text-primary" strokeWidth={1.5} />
            </motion.div>
          </div>
          {/* Subtle ring animation */}
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-0 left-0 w-32 h-32 border-2 border-primary rounded-[2.5rem] pointer-events-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <h2 className="text-3xl font-extrabold text-warm-900 mb-3 tracking-tight">Your bag is empty</h2>
          <p className="text-warm-500 text-base mb-10 max-w-sm font-medium leading-relaxed">
            Looks like you haven&apos;t added any pizza magic yet. Explore our menu and find your perfect slice!
          </p>
          
          <Link href="/menu">
            <motion.button
              className="bg-warm-900 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:bg-black transition-all flex items-center gap-3 cursor-pointer group mx-auto"
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
            >
              Start Ordering
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-warm-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-warm-200/50 sticky top-[var(--header-height)] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/menu">
              <button className="p-2 -ml-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer">
                <ArrowLeft className="w-5 h-5 text-warm-700" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-warm-900">Your Cart</h1>
              <p className="text-warm-500 text-xs font-medium">
                {count} {count === 1 ? "item" : "items"} in your bag
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => clearCart()}
            className="text-xs font-bold text-warm-400 hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Items */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Free Delivery Bar */}
            <div className="bg-white rounded-3xl p-5 border border-warm-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-warm-800">
                    {deliveryFee === 0 
                      ? "You've unlocked FREE Delivery! 🚚" 
                      : `Add ₹${Math.max(0, 499 - total)} more for FREE delivery`}
                  </span>
                </div>
                <span className="text-xs font-bold text-warm-400">₹499 Goal</span>
              </div>
              <div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (total / 499) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent-orange"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                    className="glass rounded-3xl p-5 relative group"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100/50 text-warm-400 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex gap-6">
                      {/* Image container */}
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-warm-100 flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 96px, 128px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🍕</div>
                        )}
                        <div className="absolute top-2 left-2">
                          <VegBadge isVeg={true} size="sm" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-warm-900 leading-tight">
                            {item.name}
                          </h3>
                          
                          {(item.variant || (item.addOns && item.addOns.length > 0)) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.variant && (
                                <span className="px-2 py-0.5 bg-warm-100 text-warm-500 text-[10px] uppercase tracking-wider font-bold rounded-md">
                                  {item.variant.name}
                                </span>
                              )}
                              {item.addOns?.map((a) => (
                                <span key={a.id} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] uppercase tracking-wider font-bold rounded-md">
                                  + {a.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-warm-400 font-medium">Total Price</span>
                            <span className="text-lg font-extrabold text-warm-900">
                              ₹{item.totalPrice.toFixed(0)}
                            </span>
                          </div>

                          <div className="flex items-center bg-white border border-warm-200 rounded-xl shadow-sm p-1">
                            <motion.button
                              onClick={() => {
                                if (item.quantity === 1) removeItem(item.id);
                                else updateQuantity(item.id, item.quantity - 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-primary hover:bg-warm-50 rounded-lg transition-colors cursor-pointer"
                              whileTap={{ scale: 0.9 }}
                            >
                              <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                            </motion.button>

                            <motion.span
                              key={item.quantity}
                              initial={{ y: 5, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="w-10 text-center text-sm font-bold text-warm-800"
                            >
                              {item.quantity}
                            </motion.span>

                            <motion.button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-primary hover:bg-warm-50 rounded-lg transition-colors cursor-pointer"
                              whileTap={{ scale: 0.9 }}
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Upsell Sections — "Complete Your Meal" */}
            <div className="pt-4 pb-8">
              <div className="flex items-center justify-between mb-6 px-1">
                <div>
                  <h3 className="text-xl font-extrabold text-warm-900 tracking-tight">Complete your meal</h3>
                  <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mt-1">People also ordered these treats</p>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 px-1 custom-scrollbar no-scrollbar">
                {[
                  {
                    id: "m11",
                    name: "Garlic Bread (4 pcs)",
                    price: 129,
                    imageUrl: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=600&h=450",
                    isVeg: true,
                  },
                  {
                    id: "m16",
                    name: "Choco Lava Cake",
                    price: 179,
                    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=600&h=450",
                    isVeg: true,
                    isBestSeller: true,
                  },
                  {
                    id: "m12",
                    name: "Loaded Fries",
                    price: 159,
                    imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&q=80&w=600&h=450",
                    isVeg: true,
                  },
                  {
                    id: "m15",
                    name: "Fresh Lemonade",
                    price: 89,
                    imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=600&h=450",
                    isVeg: true,
                  },
                ].filter(rec => !items.find(cartItem => cartItem.id === rec.id)).map((rec) => (
                  <motion.div
                    key={rec.id}
                    whileHover={{ y: -5 }}
                    className="flex-shrink-0 w-40 md:w-48 bg-white rounded-3xl p-3 border border-warm-200/60 shadow-sm relative group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                      <Image
                        src={rec.imageUrl}
                        alt={rec.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {rec.isBestSeller && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent-orange text-[8px] font-black text-white uppercase rounded-md">
                          Bestseller
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-warm-900 line-clamp-1">{rec.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-warm-900">₹{rec.price}</span>
                        <motion.button
                          onClick={() => {
                            useCartStore.getState().addItem({
                              id: `${rec.id}-${Date.now()}`,
                              menuItemId: rec.id,
                              name: rec.name,
                              price: rec.price,
                              imageUrl: rec.imageUrl,
                              totalPrice: rec.price,
                              quantity: 1,
                            });
                          }}
                          className="w-8 h-8 rounded-full bg-warm-900 text-white flex items-center justify-center hover:bg-primary transition-all shadow-lg"
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ rotate: 90 }}
                        >
                          <Plus className="w-4 h-4" strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <Link href="/menu">
              <motion.div 
                whileHover={{ y: -2 }}
                className="flex items-center justify-center gap-3 p-6 bg-white rounded-[2rem] border-2 border-dashed border-warm-200 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all text-warm-500 hover:text-primary group"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
                <span className="font-bold tracking-tight uppercase text-sm">Add more delicious items</span>
              </motion.div>
            </Link>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            
            {/* Coupon Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-warm-200/60 overflow-hidden relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-warm-900 text-base">Offers & Benefits</h3>
              </div>

              <AnimatePresence mode="wait">
                {couponApplied ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-50/50 border border-green-200 p-4 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-bold text-sm">
                          {couponApplied} applied
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCouponApplied(null);
                          setCouponDiscount(0);
                          setCouponCode("");
                        }}
                        className="text-[10px] font-bold text-green-600 underline uppercase tracking-wider cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-green-600/80 text-xs font-medium">
                      Wohoo! You saved ₹{couponDiscount} on this order.
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex gap-2 relative z-10">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 bg-warm-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-400 border-0 uppercase tracking-widest"
                    />
                    <motion.button
                      onClick={handleApplyCoupon}
                      className="bg-warm-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors cursor-pointer"
                      whileTap={{ scale: 0.95 }}
                    >
                      Apply
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
              
              {!couponApplied && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-1">Available Coupons</p>
                  <div className="p-3 bg-warm-50 rounded-xl border border-warm-200/50 flex items-center justify-between group cursor-pointer" onClick={() => { setCouponCode("HELLO20"); handleApplyCoupon(); }}>
                    <div>
                      <span className="text-xs font-extrabold text-warm-900">HELLO20</span>
                      <p className="text-[10px] text-warm-500">20% OFF up to ₹150</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-warm-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div id="order-summary-section" className="bg-warm-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden scroll-mt-32">
              {/* Background abstract element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <h3 className="text-xl font-bold mb-6 tracking-tight">Order Summary</h3>
              
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="text-white">₹{total}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Tax & Charges (5%)</span>
                  <span className="text-white">₹{tax}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-400 font-bold">FREE</span>
                  ) : (
                    <span className="text-white">₹{deliveryFee}</span>
                  )}
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount Applied</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                
                <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">To Pay</p>
                    <span className="text-3xl font-extrabold tracking-tight">₹{grandTotal}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Saved ₹{couponDiscount + (deliveryFee === 0 ? 30 : 0)}</p>
                  </div>
                </div>
              </div>

              <Link href="/checkout">
                <motion.button
                  className="w-full mt-8 bg-primary text-white py-5 rounded-2xl font-extrabold text-base shadow-lg hover:bg-[#cc1530] transition-colors flex items-center justify-center gap-3 cursor-pointer group"
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Confirm Order
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>
              
              {/* Trust badges */}
              <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex flex-col items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-center">Secure<br/>SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-center">Live<br/>Tracking</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-center">Hot &<br/>Fresh</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Mobile Summary Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-warm-200 z-50 flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Grand Total</span>
          <span className="text-xl font-black text-warm-900">₹{grandTotal}</span>
        </div>
        <button 
          onClick={() => document.getElementById('order-summary-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex-1 bg-warm-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          View Summary <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
