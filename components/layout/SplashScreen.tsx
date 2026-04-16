"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useLocationStore } from "@/store/location";

const ADS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200&h=800",
    title: "Flat ₹100 OFF",
    subtitle: "On your first order above ₹499",
    code: "HELLO100",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=1200&h=800",
    title: "Buy 1 Get 1 Free",
    subtitle: "On all large pizzas every Tuesday",
    code: "BOGO",
    gradient: "from-emerald-600 to-teal-600",
  },
];

// Step enum
type SplashStep = "ad" | "location" | "done";

export default function SplashScreen() {
  const [step, setStep] = useState<SplashStep>("ad");
  const [visible, setVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState(0);
  const { address, isDetecting, detectLocation, setAddress } = useLocationStore();

  // Show splash only once per session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hello-pizza-splash-seen");
    if (!hasSeenSplash) {
      setVisible(true);
    }
  }, []);

  // Auto-cycle ads
  useEffect(() => {
    if (step !== "ad") return;
    const timer = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ADS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [step]);

  const handleSkipAd = () => {
    setStep("location");
  };

  const handleDetectLocation = async () => {
    await detectLocation();
    finishSplash();
  };

  const handleSkipLocation = () => {
    finishSplash();
  };

  const finishSplash = () => {
    sessionStorage.setItem("hello-pizza-splash-seen", "true");
    setStep("done");
    setTimeout(() => setVisible(false), 500);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {step !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* ─── STEP 1: Advertisement ─── */}
            {step === "ad" && (
              <motion.div
                key="ad-step"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="relative z-10 w-[92vw] max-w-md mx-auto"
              >
                {/* Close / Skip */}
                <button
                  onClick={handleSkipAd}
                  className="absolute -top-12 right-0 text-white/70 hover:text-white text-sm font-bold flex items-center gap-1 z-50 transition-colors"
                >
                  Skip <ChevronRight className="w-4 h-4" />
                </button>

                {/* Ad Card */}
                <div className="rounded-3xl overflow-hidden bg-white shadow-2xl">
                  {/* Ad Image */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAd}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={ADS[currentAd].image}
                          alt={ADS[currentAd].title}
                          fill
                          className="object-cover"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </motion.div>
                    </AnimatePresence>

                    {/* Floating Offer Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`bg-gradient-to-r ${ADS[currentAd].gradient} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg`}>
                        🔥 Limited Time Offer
                      </div>
                    </div>

                    {/* Ad Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-3xl font-black text-white mb-1 leading-tight">
                        {ADS[currentAd].title}
                      </h2>
                      <p className="text-white/80 text-sm mb-3">
                        {ADS[currentAd].subtitle}
                      </p>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-xl text-white text-xs font-bold">
                        Use Code: <span className="text-amber-300 tracking-wider">{ADS[currentAd].code}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dots + CTA */}
                  <div className="px-6 py-5">
                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {ADS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentAd(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === currentAd ? "w-6 bg-primary" : "w-1.5 bg-warm-300"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleSkipAd}
                      className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Order Now <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: Location Detection ─── */}
            {step === "location" && (
              <motion.div
                key="location-step"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="relative z-10 w-[92vw] max-w-md mx-auto"
              >
                <div className="rounded-3xl overflow-hidden bg-white shadow-2xl p-8 text-center">
                  {/* Icon */}
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <MapPin className="w-10 h-10 text-primary" strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  <h2 className="text-2xl font-black text-warm-900 mb-2">
                    Where should we deliver?
                  </h2>
                  <p className="text-warm-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                    Allow location access to auto-fill your delivery address for a faster checkout.
                  </p>

                  {/* Detected address preview */}
                  {address && !isDetecting && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2 text-green-700 text-xs font-bold mb-1">
                        <MapPin className="w-3.5 h-3.5" /> Detected Location
                      </div>
                      <p className="text-green-900 font-semibold text-sm">{address}</p>
                    </motion.div>
                  )}

                  {/* Loading state */}
                  {isDetecting && (
                    <div className="mb-6 flex items-center justify-center gap-2 text-primary text-sm font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Detecting your location...
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetecting}
                      className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <MapPin className="w-4 h-4" />
                      {isDetecting ? "Detecting..." : "Use My Current Location"}
                    </button>
                    <button
                      onClick={handleSkipLocation}
                      className="w-full text-warm-500 hover:text-warm-700 py-2 text-sm font-semibold transition-colors"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
