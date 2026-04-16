"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Store,
  ChevronDown,
  ChevronUp,
  Wallet,
  Loader2,
  Check,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useLocationStore } from "@/store/location";
import VegBadge from "@/components/menu/VegBadge";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, getCartCount, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address: detectedAddress, isDetecting } = useLocationStore();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill address from detected location
  useEffect(() => {
    if (detectedAddress && !address) {
      setAddress(detectedAddress);
    }
  }, [detectedAddress]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = getCartCount();
  const total = getCartTotal();
  const tax = Math.round(total * 0.05);
  const deliveryFee = orderType === "pickup" ? 0 : total >= 499 ? 0 : 30;
  const grandTotal = total + tax + deliveryFee;

  useEffect(() => {
    // Only redirect if cart is empty and we're NOT in the middle of placing an order
    if (mounted && count === 0 && !isSubmitting) {
      router.push("/cart");
    }
  }, [mounted, count, router, isSubmitting]);

  if (!mounted) return null;

  if (count === 0) {
    return null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "Enter a valid 10-digit phone number";
    if (orderType === "delivery" && !address.trim())
      newErrors.address = "Delivery address is required";
    if (!email.trim())
      newErrors.email = "Email is required for order confirmation";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        orderType: orderType === "delivery" ? "DELIVERY" : "PICKUP",
        deliveryAddress: orderType === "delivery" ? address : null,
        deliveryInstructions: instructions,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          itemName: item.name,
          variantName: item.variant?.name,
          basePrice: item.price,
          variantPrice: item.variant?.price || 0,
          addonsPrice: item.addOns?.reduce((a, b) => a + b.price, 0) || 0,
          quantity: item.quantity,
          addOns: item.addOns?.map(add => ({
            addonName: add.name,
            addonPrice: add.price,
            quantity: 1
          })) || []
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        throw new Error("Failed to place order");
      }

      const responseData = await res.json();
      const orderNumber = responseData.orderNumber;
      
      clearCart();
      router.push(`/order-confirmed?order=${orderNumber}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      // In a real app we might show a toast error here
      alert("Something went wrong while placing your order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-warm-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-warm-200/50 sticky top-[var(--header-height)] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link href="/cart">
            <button className="p-2 -ml-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-warm-700" />
            </button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-warm-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Order Type */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 border border-warm-200/60 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</div>
                <h3 className="font-bold text-warm-900 text-lg">How would you like your order?</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    value: "delivery" as const,
                    icon: Truck,
                    label: "Doorstep Delivery",
                    desc: "Hot & Fresh in 30-40 mins",
                  },
                  {
                    value: "pickup" as const,
                    icon: Store,
                    label: "Self Pickup",
                    desc: "Ready to collect in 15 mins",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderType(opt.value)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer group ${
                      orderType === opt.value
                        ? "border-primary bg-primary/[0.02] ring-4 ring-primary/5"
                        : "border-warm-100 hover:border-warm-200 bg-warm-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl transition-colors ${
                        orderType === opt.value ? "bg-primary text-white" : "bg-white text-warm-400 border border-warm-100"
                      }`}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      {orderType === opt.value && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className={`block font-bold text-base ${
                        orderType === opt.value ? "text-warm-900" : "text-warm-700"
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-warm-500 font-medium">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>

            {/* 2. Contact Information */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 border border-warm-200/60 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</div>
                <h3 className="font-bold text-warm-900 text-lg">Who are we delivering to?</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-warm-400 uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aryan"
                    className={`w-full px-5 py-4 bg-warm-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-300 border-0 ${
                      errors.name ? "ring-2 ring-red-300" : ""
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold px-1">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-warm-400 uppercase tracking-widest px-1">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 py-4 bg-warm-200 rounded-l-2xl text-sm text-warm-600 font-bold border-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      className={`flex-1 px-5 py-4 bg-warm-50 rounded-r-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-300 border-0 ${
                        errors.phone ? "ring-2 ring-red-300" : ""
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold px-1">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-warm-400 uppercase tracking-widest px-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@pizza.com"
                    className={`w-full px-5 py-4 bg-warm-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-300 border-0 ${
                      errors.email ? "ring-2 ring-red-300" : ""
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] font-bold px-1">{errors.email}</p>}
                </div>
              </div>
            </motion.section>

            {/* 3. Address (Conditional) */}
            <AnimatePresence mode="wait">
              {orderType === "delivery" && (
                <motion.section 
                  key="delivery-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-warm-200/60 shadow-sm mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">3</div>
                      <h3 className="font-bold text-warm-900 text-lg">Delivery Location</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-xs font-bold text-warm-400 uppercase tracking-widest">Full Address</label>
                          <button
                            type="button"
                            onClick={() => {
                              const { detectLocation } = useLocationStore.getState();
                              detectLocation().catch(err => alert(err.message));
                            }}
                            disabled={isDetecting}
                            className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {isDetecting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            {isDetecting ? "Locating..." : "Detect My Location"}
                          </button>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 w-5 h-5 text-primary" />
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            placeholder="Apartment, Street Name, Landmark..."
                            className={`w-full pl-12 pr-5 py-4 bg-warm-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-300 border-0 resize-none ${
                              errors.address ? "ring-2 ring-red-300" : ""
                            }`}
                          />
                        </div>
                        {errors.address && <p className="text-red-500 text-[10px] font-bold px-1">{errors.address}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-warm-400 uppercase tracking-widest px-1">Delivery Instructions</label>
                        <input
                          type="text"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="e.g. Call at Gate No. 2, Keep it at the door"
                          className="w-full px-5 py-4 bg-warm-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-300 border-0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* 4. Payment */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 border border-warm-200/60 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {orderType === "delivery" ? "4" : "3"}
                </div>
                <h3 className="font-bold text-warm-900 text-lg">Payment Choice</h3>
              </div>
              
              <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/[0.04]">
                <div className="p-3 bg-primary text-white rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-warm-900 text-base">
                    Cash on Delivery
                  </span>
                  <p className="text-xs text-warm-500 font-medium">
                    Pay securely in cash or via UPI at your doorstep
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right Column: Sticky Summary & CTA */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            
            {/* Detailed Order Summary (Large) */}
            <div className="bg-warm-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <h3 className="text-xl font-bold mb-6 tracking-tight">Your Order Info</h3>
              
              <div className="space-y-5">
                {/* Scrollable item list inside summary */}
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-3 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <VegBadge isVeg={true} size="sm" />
                          <span className="font-bold text-white/90">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        {item.variant && (
                          <span className="text-[10px] uppercase font-bold text-white/40 block mt-0.5 ml-5">
                            {item.variant.name}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-white/70">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-white/10 space-y-3 text-sm font-medium">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span className="text-white">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Tax (5%)</span>
                    <span className="text-white">₹{tax}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-400 font-bold" : "text-white"}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Payable</p>
                    <span className="text-3xl font-extrabold tracking-tight">₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Action Button - Main CTA in Sticky Summary */}
              <motion.button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full mt-8 bg-primary text-white py-5 rounded-2xl font-extrabold text-base shadow-lg hover:bg-[#cc1530] transition-colors flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-70 disabled:grayscale"
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Completing Magic...
                  </>
                ) : (
                  <>
                    Finish Ordering
                    <Check className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={3} />
                  </>
                )}
              </motion.button>

              <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-wider mt-6">
                Freshly Baked & Handcrafted for you
              </p>
            </div>

            {/* Support/Trust Badges */}
            <div className="bg-white rounded-3xl p-6 border border-warm-200/60 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-success/10 text-success rounded-lg">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-warm-900">Secure Checkout</span>
                  <span className="text-[10px] text-warm-400 font-medium">Encrypted & Safe</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-warm-100 flex items-center justify-center text-[8px] font-bold">UPI</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-warm-900 text-white flex items-center justify-center text-[8px] font-bold">COD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Mobile Bar - Price visibility for small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-warm-200/50 p-4 z-50 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div>
          <span className="text-[10px] font-bold text-warm-400 uppercase tracking-widest block">Total to Pay</span>
          <span className="text-xl font-black text-warm-900">₹{grandTotal}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="bg-primary text-white font-black px-8 py-3.5 rounded-xl text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Place Order"}
        </button>
      </div>
    </div>
  );
}
