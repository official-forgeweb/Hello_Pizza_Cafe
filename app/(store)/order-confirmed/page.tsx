"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, MapPin, ChevronRight, Copy, CheckCheck } from "lucide-react";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "ORD-00000000";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-success/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full text-center space-y-10 relative z-10"
      >
        {/* Celebrate Icon */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="relative"
          >
            {/* Animated Rings */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute inset-0 w-32 h-32 rounded-[2.5rem] border-2 border-success/30 -m-4"
            />
            
            <div className="w-24 h-24 rounded-[2.5rem] bg-success flex items-center justify-center relative z-10 shadow-2xl shadow-success/40">
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Check className="w-12 h-12 text-white" strokeWidth={4} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-black text-warm-900 tracking-tight leading-tight">
            Order Confirmed!
          </h1>
          <p className="text-warm-500 text-lg font-medium max-w-sm mx-auto">
            Your pizza party is officially in motion. We&apos;ve sent a confirmation to your email.
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <div className="px-5 py-2.5 bg-warm-900/5 rounded-2xl border border-warm-200/50 flex items-center gap-3 group">
              <span className="text-xs font-bold text-warm-400 uppercase tracking-widest">ID:</span>
              <span className="font-black text-warm-900 tracking-wider">#{orderNumber}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer group-hover:scale-110 active:scale-95"
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-warm-400" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tracking Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm glass relative overflow-hidden"
          >
            <div className="p-3 bg-primary/10 text-primary w-fit rounded-xl mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-1">Arrival Estimate</p>
            <p className="text-xl font-black text-warm-900">30-40 MINS</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-3xl p-6 border border-warm-100 shadow-sm glass relative overflow-hidden"
          >
            <div className="p-3 bg-success/10 text-success w-fit rounded-xl mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-warm-400 uppercase tracking-widest mb-1">Delivering to</p>
            <p className="text-base font-bold text-warm-800 line-clamp-1">Connaught Place, New Delhi</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl" />
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="pt-6"
        >
          <Link href="/menu" className="inline-block w-full sm:w-auto">
            <motion.button
              className="w-full sm:w-auto px-12 py-5 bg-warm-900 text-white rounded-[1.5rem] font-black text-base shadow-2xl shadow-warm-900/20 flex items-center justify-center gap-3 hover:bg-black transition-all cursor-pointer group"
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
            >
              Order Something More
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
          <p className="text-xs font-bold text-warm-300 uppercase tracking-[0.2em] mt-8">
            Thank you for choosing Hello Pizza
          </p>
        </motion.div>
      </motion.div>
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
