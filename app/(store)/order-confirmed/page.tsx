"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Clock, MapPin, ChevronRight, Copy, CheckCheck, 
  ChefHat, PhoneCall, AlertTriangle, XCircle
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

  useEffect(() => {
    if (!orderNumber || orderNumber === "ORD-00000000") {
      setStatus("ERROR");
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/status?orderNumber=${orderNumber}`);
        const data = await res.json();
        
        if (data.success && data.order) {
          setOrderData(data.order);
          const currentStatus = data.order.status;
          
          if (currentStatus === "PENDING") {
            setStatus("PENDING");
          } else if (currentStatus === "CANCELLED") {
            setStatus("CANCELLED");
            setCancellationReason(data.order.cancellationReason);
            clearInterval(intervalId);
          } else {
            // CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED
            setStatus("CONFIRMED");
            if (currentStatus === "DELIVERED") {
              clearInterval(intervalId);
            }
          }
        } else {
          setStatus("ERROR");
          clearInterval(intervalId);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" 
      />

      <AnimatePresence mode="wait">
        {status === "LOADING" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full text-center space-y-6 bg-white/40 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-xl z-10"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-warm-900">Verifying Order...</h2>
            <p className="text-warm-500 font-semibold text-sm">Please wait while we connect to our servers to load your order details.</p>
          </motion.div>
        )}

        {status === "PENDING" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl w-full text-center space-y-8 relative z-10"
          >
            {/* Pulsing Chef Hat visual */}
            <div className="flex justify-center">
              <div className="relative">
                <motion.div
                  animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-amber-500/20 -m-4 blur-md"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-0 w-32 h-32 rounded-[2.5rem] border-2 border-dashed border-amber-500/40 -m-4"
                />
                
                <div 
                  className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center relative z-10 shadow-2xl"
                  style={{ boxShadow: "0 20px 50px -12px rgba(245, 158, 11, 0.35)" }}
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
              <h1 className="text-3xl md:text-4xl font-black text-warm-900 tracking-tight leading-tight">
                Awaiting Confirmation
              </h1>
              <p className="text-warm-500 text-base font-semibold max-w-md mx-auto">
                We've placed your order and sent it to our restaurant kitchen's POS system. Our cashier is reviewing it right now! 🍕
              </p>
              
              {/* Order ID */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="px-5 py-2.5 bg-warm-900/5 rounded-2xl border border-warm-200/50 flex items-center gap-3">
                  <span className="text-xs font-bold text-warm-400 uppercase tracking-widest">ID:</span>
                  <span className="font-black text-warm-900 tracking-wider">#{orderNumber}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
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

            {/* Pulsing Horizontal loading bar */}
            <div className="max-w-xs mx-auto bg-warm-100 h-2.5 rounded-full overflow-hidden relative">
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="w-1/2 h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
              />
            </div>

            {/* Need Help Card */}
            <div className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <PhoneCall className="w-6 h-6 text-amber-500 mb-2" />
              <h4 className="font-bold text-warm-900">Need instant help?</h4>
              <p className="text-sm text-warm-500 mb-4">Feel free to call our restaurant directly if you have any special instructions.</p>
              <a
                href="tel:8586076383"
                className="px-6 py-3 bg-warm-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 active:scale-95 text-sm"
              >
                <PhoneCall className="w-4 h-4" />
                +91 8586076383
              </a>
            </div>
          </motion.div>
        )}

        {status === "CONFIRMED" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl w-full text-center space-y-8 relative z-10"
          >
            {/* Bouncing Circle Check visual */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [0.8, 1.5], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute inset-0 w-32 h-32 rounded-[2.5rem] border-2 border-primary/30 -m-4"
                />
                
                <div 
                  className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-success to-emerald-400 flex items-center justify-center relative z-10 shadow-2xl"
                  style={{ boxShadow: "0 20px 50px -12px rgba(16, 185, 129, 0.35)" }}
                >
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
              </motion.div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-warm-900 tracking-tight leading-tight">
                Order Confirmed!
              </h1>
              <p className="text-warm-500 text-base font-semibold max-w-sm mx-auto">
                Awesome! The kitchen has accepted your order and our chefs are safely preparing your delicious meal 👨‍🍳
              </p>
              
              {/* Order ID */}
              <div className="flex items-center justify-center gap-3">
                <div className="px-5 py-2.5 bg-warm-900/5 rounded-2xl border border-warm-200/50 flex items-center gap-3">
                  <span className="text-xs font-bold text-warm-400 uppercase tracking-widest">ID:</span>
                  <span className="font-black text-warm-900 tracking-wider">#{orderNumber}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
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
              <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center shrink-0">
                <CheckCheck className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <h4 className="font-bold text-warm-900 flex items-center gap-2">
                  Order details sent on WhatsApp
                  <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </h4>
                <p className="text-sm font-medium text-warm-600 mt-1">You will receive live tracking updates on your WhatsApp.</p>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm relative overflow-hidden">
                <div className="p-3 bg-primary/10 text-primary w-fit rounded-xl mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                <p className="text-xl font-black text-warm-900">30-40 MINS</p>
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl" />
              </div>

              <div className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm relative overflow-hidden">
                <div className="p-3 bg-success/10 text-success w-fit rounded-xl mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-1">Delivering to</p>
                <p className="text-base font-bold text-warm-800 line-clamp-2">{address || orderData?.deliveryAddress || "Your Location"}</p>
                <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl" />
              </div>
            </div>

            {/* Action Menu */}
            <div className="pt-4">
              <Link href="/menu" className="inline-block w-full sm:w-auto">
                <button className="w-full sm:w-auto px-12 py-5 bg-warm-900 text-white rounded-[1.5rem] font-black text-base shadow-2xl shadow-warm-900/20 flex items-center justify-center gap-3 hover:bg-black transition-all cursor-pointer group">
                  Order Something More
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <p className="text-xs font-bold text-warm-300 uppercase tracking-[0.2em] mt-8">
                Thank you for choosing Hello Pizza
              </p>
            </div>
          </motion.div>
        )}

        {status === "CANCELLED" && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl w-full text-center space-y-8 relative z-10"
          >
            {/* Bouncing Rejection Warning visual */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-red-500/20 -m-4 blur-md"
                />
                
                <div 
                  className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center relative z-10 shadow-2xl"
                  style={{ boxShadow: "0 20px 50px -12px rgba(239, 68, 68, 0.4)" }}
                >
                  <AlertTriangle className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
              </motion.div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-red-600 tracking-tight leading-tight">
                Order Cancelled
              </h1>
              <p className="text-warm-500 text-base font-semibold max-w-sm mx-auto">
                Unfortunately, the restaurant was unable to accept your order at this time.
              </p>
              
              {/* Order ID */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <div className="px-5 py-2.5 bg-red-500/5 rounded-2xl border border-red-200/20 flex items-center gap-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">ID:</span>
                  <span className="font-black text-red-800 tracking-wider">#{orderNumber}</span>
                </div>
              </div>
            </div>

            {/* Rejection Reason Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-red-500/5 border border-red-200/20 rounded-3xl p-6 md:p-8 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none" />
              
              <h3 className="text-lg font-black text-red-800 mb-2 relative z-10 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Restaurant Rejection Note
              </h3>
              <p className="text-red-700 bg-red-500/10 border border-red-500/10 px-4 py-3 rounded-2xl font-black text-base relative z-10">
                "{cancellationReason || "Kitchen was unable to process order"}"
              </p>
              <p className="text-warm-500 text-xs font-bold uppercase tracking-wider mt-4 relative z-10">
                Refund Information
              </p>
              <p className="text-warm-500 text-sm font-semibold mt-1 relative z-10 leading-relaxed">
                If you completed an online pre-payment, a full refund has been automatically initiated and will reflect in your account within 3-5 working days.
              </p>
            </motion.div>

            {/* Contact / Re-order actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="tel:8586076383"
                className="w-full sm:w-auto px-8 py-4 bg-warm-900 text-white rounded-2xl font-black shadow-xl shadow-warm-900/10 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 text-base"
              >
                <PhoneCall className="w-5 h-5" />
                Call Restaurant
              </a>
              <Link href="/menu" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 bg-white border border-warm-200 hover:border-warm-400 text-warm-900 rounded-2xl font-black shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 text-base">
                  Go Back to Menu
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {status === "ERROR" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full text-center space-y-6 bg-red-50 p-8 rounded-3xl border border-red-100 z-10"
          >
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-red-900">Order Not Found</h2>
            <p className="text-red-700 font-semibold text-sm">We couldn't retrieve details for order #{orderNumber}. Please check the URL or contact us for assistance.</p>
            <div className="pt-2">
              <Link href="/menu">
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all text-sm shadow-md">
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
