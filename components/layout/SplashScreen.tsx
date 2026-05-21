"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocationStore } from "@/store/location";

// Splash flow: loading → ad → location → done
type SplashStep = "loading" | "ad" | "location" | "done";

// Minimum time (ms) the branded loader stays visible — acts as content buffer
const MIN_LOADING_MS = 2200;
// How long each ad shows before cycling
const AD_CYCLE_MS = 6000;
// Auto-skip ads after this many ms
const AD_AUTO_SKIP_MS = 30000;

export default function SplashScreen() {
  const [step, setStep] = useState<SplashStep>("loading");
  const [visible, setVisible] = useState(true); // Always start visible
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [adsReady, setAdsReady] = useState(false);
  const loadStartRef = useRef(Date.now());
  const { address, isDetecting, detectLocation } = useLocationStore();

  // ── STEP 1: Branded loading screen + fetch ads in parallel ──
  useEffect(() => {
    loadStartRef.current = Date.now();

    const fetchAds = fetch("/api/admin/splash-ads")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const activeAds = data.filter((ad: any) => ad.isActive);
          return activeAds;
        }
        return [];
      })
      .catch(err => {
        console.error("Failed to load splash ads:", err);
        return [];
      });

    // Wait for BOTH minimum loading time AND ads fetch to complete
    const minWait = new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS));

    Promise.all([fetchAds, minWait]).then(([fetchedAds]) => {
      if (fetchedAds.length > 0) {
        setAds(fetchedAds);
        setAdsReady(true);
        setStep("ad");
      } else {
        // No active ads — skip straight to location
        setStep("location");
      }
    });
  }, []);

  // ── Auto-skip ads after 30 seconds ──
  useEffect(() => {
    if (step !== "ad" || !visible) return;
    const autoSkip = setTimeout(() => {
      setStep("location");
    }, AD_AUTO_SKIP_MS);
    return () => clearTimeout(autoSkip);
  }, [step, visible]);

  // ── Auto-cycle ads every 6 seconds ──
  useEffect(() => {
    if (step !== "ad" || ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAd(prev => (prev + 1) % ads.length);
    }, AD_CYCLE_MS);
    return () => clearInterval(timer);
  }, [step, ads.length]);

  // ── Auto-detect location if permission already granted ──
  useEffect(() => {
    if (step !== "location") return;

    // If user already has a saved address, skip location step
    if (address) {
      finishSplash();
      return;
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then(async (result) => {
        if (result.state === "granted") {
          try {
            await detectLocation();
          } catch {}
          finishSplash();
        }
      }).catch(() => {});
    }
  }, [step, address, detectLocation]);

  const handleSkipAd = () => {
    setStep("location");
  };

  const handleDetectLocation = useCallback(async () => {
    try {
      await detectLocation();
    } catch (err: any) {
      console.warn("Location ignored:", err.message);
    } finally {
      finishSplash();
    }
  }, [detectLocation]);

  const handleSkipLocation = () => {
    finishSplash();
  };

  const finishSplash = () => {
    setStep("done");
    setTimeout(() => setVisible(false), 400);
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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" />

          <AnimatePresence mode="wait">
            {/* ─── LOADING / BUFFER SCREEN ─── */}
            {step === "loading" && (
              <motion.div
                key="loading-step"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center justify-center gap-6"
              >
                {/* Animated Logo */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="w-64 h-64 md:w-80 md:h-80 relative">
                    <Image
                      src="/logo-splash.png"
                      alt="Hello Pizza Café"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>
                </motion.div>

                {/* Loading Indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Animated dots loader */}
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-white/40 text-xs font-medium tracking-wide">
                    Preparing your experience...
                  </p>
                </motion.div>

                {/* Decorative glow ring behind logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-60 md:h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              </motion.div>
            )}

            {/* ─── STEP 2: ADVERTISEMENT ─── */}
            {step === "ad" && adsReady && (
              <motion.div
                key="ad-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 w-[92vw] max-w-md mx-auto"
              >
                {/* Skip button */}
                <button
                  onClick={handleSkipAd}
                  className="absolute -top-12 right-0 text-white/70 hover:text-white text-sm font-bold flex items-center gap-1 z-50 transition-colors cursor-pointer"
                >
                  Skip <ChevronRight className="w-4 h-4" />
                </button>

                {/* Ad Card */}
                <div className="rounded-3xl overflow-hidden bg-warm-900 shadow-2xl">
                  {/* Ad Image */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-warm-900">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentAd}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={ads[currentAd]?.imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80"}
                          alt={ads[currentAd]?.title || "Promo"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 92vw, 448px"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Floating Offer Badge */}
                    <div className="absolute top-4 left-4">
                      <div className={`bg-gradient-to-r ${ads[currentAd]?.gradient || "from-orange-600 to-red-600"} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg`}>
                        🔥 Limited Time Offer
                      </div>
                    </div>

                    {/* Countdown Timer Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                      <motion.div
                        key={`timer-${currentAd}`}
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: AD_CYCLE_MS / 1000, ease: "linear" }}
                      />
                    </div>

                    {/* Ad Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h2 className="text-3xl font-black text-white mb-1 leading-tight">
                        {ads[currentAd]?.title}
                      </h2>
                      <p className="text-white/80 text-sm mb-3">
                        {ads[currentAd]?.subtitle}
                      </p>
                      {ads[currentAd]?.code && (
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-xl text-white text-xs font-bold">
                          Use Code: <span className="text-amber-300 tracking-wider">{ads[currentAd]?.code}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dots + CTA */}
                  <div className="px-6 py-5 bg-white">
                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {ads.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setCurrentAd(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            i === currentAd ? "w-6 bg-primary" : "w-1.5 bg-warm-300"
                          }`}
                        />
                      ))}
                    </div>

                    <Link 
                      href={ads[currentAd]?.linkUrl || "/offers"}
                      onClick={finishSplash}
                      className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Explore Offers <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: LOCATION DETECTION ─── */}
            {step === "location" && (
              <motion.div
                key="location-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-[92vw] max-w-md mx-auto"
              >
                <div className="rounded-3xl overflow-hidden bg-white shadow-2xl p-8 text-center">
                  {/* Icon */}
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MapPin className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  </div>

                  <h2 className="text-2xl font-black text-warm-900 mb-2">
                    Where should we deliver?
                  </h2>
                  <p className="text-warm-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                    Allow location access to auto-fill your delivery address for a faster checkout.
                  </p>

                  {/* Detected address preview */}
                  {address && !isDetecting && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-green-700 text-xs font-bold mb-1">
                        <MapPin className="w-3.5 h-3.5" /> Detected Location
                      </div>
                      <p className="text-green-900 font-semibold text-sm">{address}</p>
                    </div>
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
                      className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      {isDetecting ? "Detecting..." : "Use My Current Location"}
                    </button>
                    <button
                      onClick={handleSkipLocation}
                      className="w-full text-warm-500 hover:text-warm-700 py-2 text-sm font-semibold transition-colors cursor-pointer"
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
