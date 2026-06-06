/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Clock, MapPin, ChevronRight, Copy, CheckCheck, 
  ChefHat, PhoneCall, AlertTriangle, XCircle, ShoppingBag, 
  Sparkles, RefreshCcw, Home
} from "lucide-react";
import { useLocationStore } from "@/store/location";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "ORD-00000000";
  const [copied, setCopied] = useState(false);
  const { address } = useLocationStore();

  const [status, setStatus] = useState<"LOADING" | "PENDING" | "CONFIRMED" | "CANCELLED" | "ERROR">("LOADING");
  const [cancellationReason, setCancellationReason] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Dev switcher to inspect layouts side-by-side / sequentially in dev environment
  const [devModeStatus, setDevModeStatus] = useState<"LOADING" | "PENDING" | "CONFIRMED" | "CANCELLED" | "ERROR" | null>(null);

  useEffect(() => {
    if (!orderNumber || orderNumber === "ORD-00000000") {
      setStatus("ERROR");
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let consecutiveFailures = 0;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/status?orderNumber=${orderNumber}`, {
          cache: "no-store"
        });
        const data = await res.json();
        
        if (data.success && data.order) {
          consecutiveFailures = 0; // Reset consecutive failures on successful retrieval
          setOrderData(data.order);
          const currentStatus = data.order.status;
          
          if (currentStatus === "PENDING") {
            setStatus("PENDING");
          } else if (currentStatus === "CANCELLED") {
            setStatus("CANCELLED");
            setCancellationReason(data.order.cancellationReason);
            if (intervalId) clearInterval(intervalId);
          } else {
            // CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
            setStatus("CONFIRMED");
            if (currentStatus === "DELIVERED" && intervalId) {
              clearInterval(intervalId);
            }
          }
        } else {
          consecutiveFailures++;
          // Only show ERROR if we get 4 consecutive failed attempts (approx 16 seconds of retries)
          if (consecutiveFailures >= 4) {
            setStatus("ERROR");
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Error polling order status:", err);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 4000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderNumber]);

  // Mock items in case API is loading or database order is blank (fallback visual safety)
  const defaultMockItems = [
    { id: "1", itemName: "Super Cheesy Pizza", quantity: 1, variantName: "Medium", itemTotal: "499.00" },
    { id: "2", itemName: "Stuffed Garlic Bread", quantity: 1, variantName: null, itemTotal: "149.00" }
  ];

  const orderItems = orderData?.items || defaultMockItems;
  const subtotal = orderData ? Number(orderData.subtotal) : 648.00;
  const deliveryFee = orderData ? Number(orderData.deliveryFee) : 40.00;
  const taxAmount = orderData ? Number(orderData.taxAmount) : 32.40;
  const totalAmount = orderData ? Number(orderData.totalAmount) : 720.40;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayStatus = devModeStatus || status;

  return (
    <div className="min-h-[92vh] flex flex-col items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden bg-warm-50/30">
      {/* Background Decorative Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.25, 1],
          opacity: [0.08, 0.14, 0.08],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.06, 0.12, 0.06],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" 
      />

      {/* Dev Mode Switcher Panel */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-50 bg-warm-900/95 text-white px-4 py-3.5 rounded-2xl border border-white/10 shadow-2xl flex flex-wrap items-center gap-3 text-xs font-bold backdrop-blur-md">
          <span className="text-primary-400">Dev Layout Switcher:</span>
          <button 
            onClick={() => setDevModeStatus("PENDING")} 
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${displayStatus === "PENDING" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Awaiting (Pending)
          </button>
          <button 
            onClick={() => setDevModeStatus("CONFIRMED")} 
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${displayStatus === "CONFIRMED" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Confirmed (Success)
          </button>
          <button 
            onClick={() => setDevModeStatus("CANCELLED")} 
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${displayStatus === "CANCELLED" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Cancelled (Reject)
          </button>
          <button 
            onClick={() => setDevModeStatus(null)} 
            className="px-2 py-1.5 bg-white/25 rounded-lg hover:bg-white/30 text-white/80 cursor-pointer"
            title="Reset to database polling"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {displayStatus === "LOADING" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full text-center space-y-6 bg-white/75 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-2xl z-10"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-warm-900">Verifying Order...</h2>
            <p className="text-warm-500 font-semibold text-sm">Please wait while we connect to our servers to load your order details.</p>
          </motion.div>
        )}

        {/* ---------------- PENDING (AWAITING CONFIRMATION) VIEW ---------------- */}
        {displayStatus === "PENDING" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
          >
            {/* Left Main Card */}
            <div className="lg:col-span-7 space-y-8 bg-white/60 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-[2.5rem] shadow-2xl text-center">
              {/* Rotating / Pulsing Pizza Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Ambient pulsing blur glow */}
                  <motion.div
                    animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.15, 0.3, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-amber-500/20 -m-4 blur-xl pointer-events-none"
                  />

                  {/* Concentric expanding ripples (Radar/Sonar wave effect) */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.85, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.4,
                        delay: i * 0.8,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 w-32 h-32 rounded-[2.5rem] border border-amber-500/30 -m-4 pointer-events-none"
                    />
                  ))}
                  
                  <div 
                    className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center relative z-10 shadow-xl"
                    style={{ boxShadow: "0 20px 40px -12px rgba(245, 158, 11, 0.3)" }}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <ChefHat className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Kitchen Reviewing
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-warm-900 tracking-tight leading-tight">
                  Awaiting Confirmation
                </h1>
                <p className="text-warm-500 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                  We&apos;ve placed your order and sent it to our restaurant kitchen&apos;s POS system. Our cashier is reviewing it right now! 🍕
                </p>
                
                {/* Order ID Badge */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="px-5 py-2.5 bg-warm-900/5 rounded-2xl border border-warm-200/50 flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-warm-400 uppercase tracking-widest">Order ID</span>
                    <span className="font-black text-warm-900 tracking-wider font-mono">#{orderNumber}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-warm-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="max-w-xs mx-auto bg-warm-100 h-2.5 rounded-full overflow-hidden relative">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                />
              </div>

              {/* Call support card */}
              <div className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <PhoneCall className="w-5 h-5 text-amber-500 mb-2" />
                <h4 className="font-bold text-warm-900 text-sm">Need instant assistance?</h4>
                <p className="text-xs text-warm-500 mb-4 max-w-[260px]">Feel free to call our restaurant directly if you have any special instructions or customization updates.</p>
                <a
                  href="tel:8586076383"
                  className="px-6 py-3 bg-warm-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 active:scale-95 text-xs shadow-md shadow-warm-900/10 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  +91 8586076383
                </a>
              </div>
            </div>

            {/* Right Column: Receipt Summary */}
            <div className="lg:col-span-5 space-y-6">
              <OrderSummaryCard 
                orderItems={orderItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                taxAmount={taxAmount}
                totalAmount={totalAmount}
                orderData={orderData}
              />
            </div>
          </motion.div>
        )}

        {/* ---------------- CONFIRMED (SUCCESS) VIEW ---------------- */}
        {displayStatus === "CONFIRMED" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
          >
            {/* Left Column: Confirmation Visuals & Tracker */}
            <div className="lg:col-span-7 space-y-6 bg-white/60 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
              {/* Bouncing Checkmark Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [0.8, 1.45], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 w-32 h-32 rounded-[2.5rem] border-2 border-emerald-500/30 -m-4"
                  />
                  
                  <div 
                    className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-success to-emerald-400 flex items-center justify-center relative z-10 shadow-lg"
                    style={{ boxShadow: "0 20px 40px -12px rgba(16, 185, 129, 0.3)" }}
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3.5} />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-3 text-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" /> Approved & In Kitchen
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-warm-900 tracking-tight leading-tight">
                  Order Confirmed!
                </h1>
                <p className="text-warm-500 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                  Awesome! The kitchen has accepted your order and our chefs are safely preparing your delicious meal 👨‍🍳
                </p>
                
                {/* Order ID */}
                <div className="flex items-center justify-center gap-3">
                  <div className="px-5 py-2.5 bg-warm-900/5 rounded-2xl border border-warm-200/50 flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-warm-400 uppercase tracking-widest">Order ID</span>
                    <span className="font-black text-warm-900 tracking-wider font-mono">#{orderNumber}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-warm-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Confirmation Banner */}
              <div className="bg-[#25D366]/5 border border-[#25D366]/20 rounded-3xl p-4 md:p-5 flex items-center gap-4 text-left">
                <div className="w-11 h-11 bg-[#25D366]/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCheck className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h4 className="font-bold text-warm-900 text-xs flex items-center gap-2">
                    Order details sent on WhatsApp
                    <svg className="w-3.5 h-3.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </h4>
                  <p className="text-[11px] font-semibold text-warm-600 mt-0.5">You will receive live tracking updates directly on your WhatsApp.</p>
                </div>
              </div>

              {/* Detailed Live Timeline Tracker */}
              <OrderTimelineTracker status={orderData?.status || "CONFIRMED"} />

              {/* Back to Menu Actions */}
              <div className="pt-2 text-center flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/menu" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 bg-warm-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-warm-900/10 flex items-center justify-center gap-2 hover:bg-black transition-all cursor-pointer group">
                    <ShoppingBag className="w-4 h-4" />
                    Order Something More
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="/home" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white border border-warm-200 text-warm-850 hover:bg-warm-100 hover:border-warm-300 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Home className="w-4 h-4" />
                    Return Home
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: Receipt Summary & Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              {/* Delivery ETA & Address Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-white rounded-3xl p-5 border border-warm-100 shadow-sm relative overflow-hidden">
                  <div className="p-2.5 bg-primary/10 text-primary w-fit rounded-xl mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-extrabold text-warm-400 uppercase tracking-widest mb-0.5">Estimated Arrival</p>
                  <p className="text-lg font-black text-warm-900">30-45 MINS</p>
                  <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-lg" />
                </div>

                <div className="bg-white rounded-3xl p-5 border border-warm-100 shadow-sm relative overflow-hidden">
                  <div className="p-2.5 bg-success/10 text-success w-fit rounded-xl mb-3">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-extrabold text-warm-400 uppercase tracking-widest mb-0.5">Delivering to</p>
                  <p className="text-xs font-bold text-warm-800 line-clamp-2 leading-relaxed">{address || orderData?.deliveryAddress || "Your Location"}</p>
                  <div className="absolute top-0 right-0 w-12 h-12 bg-success/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-lg" />
                </div>
              </div>

              <OrderSummaryCard 
                orderItems={orderItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                taxAmount={taxAmount}
                totalAmount={totalAmount}
                orderData={orderData}
              />
            </div>
          </motion.div>
        )}

        {/* ---------------- CANCELLED (REJECT) VIEW ---------------- */}
        {displayStatus === "CANCELLED" && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
          >
            {/* Left Column: Main Warning Details */}
            <div className="lg:col-span-7 space-y-6 bg-white/60 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
              {/* Pulsing Warning Warning Visual */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: 15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-red-500/20 -m-4 blur-md"
                  />
                  
                  <div 
                    className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center relative z-10 shadow-lg"
                    style={{ boxShadow: "0 20px 40px -12px rgba(239, 68, 68, 0.35)" }}
                  >
                    <AlertTriangle className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-3 text-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-black uppercase tracking-wider">
                  <XCircle className="w-3.5 h-3.5" /> Order Cancelled
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-red-600 tracking-tight leading-tight">
                  Rejection Warning
                </h1>
                <p className="text-warm-500 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                  Unfortunately, the restaurant was unable to accept or process your order at this time.
                </p>
                
                {/* Order ID */}
                <div className="flex items-center justify-center gap-3">
                  <div className="px-5 py-2.5 bg-red-500/5 rounded-2xl border border-red-200/20 flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Order ID</span>
                    <span className="font-black text-red-800 tracking-wider font-mono">#{orderNumber}</span>
                  </div>
                </div>
              </div>

              {/* Rejection Reason Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-red-500/5 border border-red-200/25 rounded-3xl p-6 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl pointer-events-none" />
                
                <h3 className="text-sm font-black text-red-800 mb-2.5 relative z-10 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Kitchen Cancellation Note:
                </h3>
                <p className="text-red-700 bg-red-500/10 border border-red-500/10 px-4 py-3.5 rounded-2xl font-black text-sm relative z-10 italic">
                  &ldquo;{cancellationReason || "Kitchen was unable to process order due to high order volume or closing hours."}&rdquo;
                </p>
                
                <p className="text-warm-400 text-[10px] font-extrabold uppercase tracking-widest mt-5 relative z-10">
                  Pre-paid Refund Policy
                </p>
                <p className="text-warm-500 text-xs font-semibold mt-1 relative z-10 leading-relaxed">
                  If you completed online UPI or pre-payment, a full refund has been automatically initiated. The amount will reflect back in your bank account/payment source within 3-5 working days.
                </p>
              </motion.div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href="tel:8586076383"
                  className="w-full sm:w-auto px-8 py-4 bg-warm-900 text-white rounded-2xl font-black shadow-xl shadow-warm-900/10 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 text-sm cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Restaurant Support
                </a>
                <Link href="/menu" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white border border-warm-200 hover:border-warm-400 text-warm-900 rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 text-sm cursor-pointer">
                    Go Back to Menu
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Column: Receipt Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              <OrderSummaryCard 
                orderItems={orderItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                taxAmount={taxAmount}
                totalAmount={totalAmount}
                orderData={orderData}
              />
            </div>
          </motion.div>
        )}

        {/* ---------------- ERROR STATE ---------------- */}
        {displayStatus === "ERROR" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full text-center space-y-6 bg-red-50 p-8 rounded-[2rem] border border-red-100 z-10 shadow-xl"
          >
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-red-900">Order Not Found</h2>
            <p className="text-red-700 font-semibold text-xs leading-relaxed">We couldn&apos;t retrieve details for order #{orderNumber}. Please check the receipt URL or contact customer support for immediate help.</p>
            <div className="pt-2">
              <Link href="/menu">
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all text-xs shadow-md cursor-pointer">
                  Return to Menu
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Order Timeline Progress Tracker
function OrderTimelineTracker({ status }: { status: string }) {
  const steps = [
    { key: "PLACED", label: "Order Received", desc: "Your order details have been received", doneStates: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    { key: "ACCEPTED", label: "Accepted by Kitchen", desc: "Kitchen cashier confirmed your order", doneStates: ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    { key: "PREPARING", label: "Preparing Meal", desc: "Chefs are preparing and baking your pizza", doneStates: ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    { key: "READY", label: "Out for Delivery", desc: "Executive is carrying your hot meal", doneStates: ["OUT_FOR_DELIVERY", "DELIVERED"] },
    { key: "DELIVERED", label: "Delivered", desc: "Enjoy your fresh, hot pizza!", doneStates: ["DELIVERED"] }
  ];

  const currentStepIndex = steps.findIndex(step => {
    if (status === "PENDING" && step.key === "PLACED") return true;
    if (status === "CONFIRMED" && step.key === "ACCEPTED") return true;
    if (status === "PREPARING" && step.key === "PREPARING") return true;
    if (status === "READY" && step.key === "READY") return true;
    if (status === "OUT_FOR_DELIVERY" && step.key === "READY") return true;
    if (status === "DELIVERED" && step.key === "DELIVERED") return true;
    return false;
  });

  return (
    <div className="bg-white/80 border border-warm-200/50 rounded-3xl p-6 text-left space-y-4">
      <h4 className="font-extrabold text-warm-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-primary" /> Live Order Tracking
      </h4>
      <div className="relative pl-6 border-l-2 border-warm-200 space-y-6 ml-3 py-1">
        {steps.map((step, idx) => {
          const isDone = step.doneStates.includes(status);
          const isActive = idx === currentStepIndex || (status === "PENDING" && idx === 1); // special highlight for pending acceptance
          
          return (
            <div key={idx} className="relative">
              <div className={`absolute -left-[33px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                isDone 
                  ? "bg-emerald-500 border-white"
                  : isActive
                    ? "bg-amber-400 border-white animate-pulse"
                    : "bg-warm-100 border-warm-200"
              }`}>
                {isDone ? (
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-warm-350"}`} />
                )}
              </div>
              <p className={`font-bold text-xs ${isActive ? "text-primary text-[13px]" : "text-warm-900"}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-warm-450 font-medium leading-normal mt-0.5">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Receipt Card Component
function OrderSummaryCard({ orderItems, subtotal, deliveryFee, taxAmount, totalAmount }: any) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-warm-200/60 rounded-[2rem] p-6 shadow-xl shadow-warm-900/5 space-y-6">
      <h3 className="font-extrabold text-warm-900 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-warm-100 pb-4">
        <ShoppingBag className="w-4 h-4 text-primary" />
        Order Summary
      </h3>

      {/* Items List */}
      <div className="divide-y divide-warm-100/60 max-h-[300px] overflow-y-auto pr-1">
        {orderItems.map((item: any) => (
          <div key={item.id} className="py-3 flex justify-between items-start gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-warm-800 leading-snug">
                <span className="text-primary font-black mr-1">{item.quantity}x</span> {item.itemName}
              </p>
              {item.variantName && (
                <p className="text-[10px] text-warm-400 font-semibold uppercase">Variant: {item.variantName}</p>
              )}
              {item.addOns?.length > 0 && (
                <p className="text-[10px] text-warm-450 font-medium italic">
                  Extras: {item.addOns.map((a: any) => a.addonName).join(", ")}
                </p>
              )}
            </div>
            <p className="font-mono font-bold text-warm-950 text-right">
              ₹{Number(item.itemTotal).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 pt-4 border-t border-dashed border-warm-200 text-xs">
        <div className="flex justify-between font-semibold text-warm-500">
          <span>Subtotal</span>
          <span className="font-mono">₹{Number(subtotal).toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between font-semibold text-warm-500">
            <span>Delivery Charges</span>
            <span className="font-mono">₹{Number(deliveryFee).toFixed(2)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between font-semibold text-warm-500">
            <span>GST & Restaurant Tax</span>
            <span className="font-mono">₹{Number(taxAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-xs text-warm-900 pt-2.5 border-t border-warm-150">
          <span>Grand Total</span>
          <span className="font-mono text-primary text-base">₹{Number(totalAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  );
}
