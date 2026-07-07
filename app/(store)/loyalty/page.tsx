"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, Search, RefreshCw, Calendar, ArrowUpRight, ArrowDownLeft, 
  Award, Clock, Crown, Sparkles, Shield, Coins, ArrowRight,
  Filter, CheckCircle, Info, ChevronRight, AlertTriangle
} from "lucide-react";

interface Transaction {
  id: string;
  type: string; // EARN, REDEEM, BONUS, EXPIRE
  points: number;
  timestamp: string;
  expiryDate: string | null;
  orderId?: string | null;
}

interface TierConfig {
  name: string;
  className: string;
  accentColor: string;
  bgGradient: string;
  borderGlow: string;
  badgeBg: string;
}

function getTierConfig(points: number): TierConfig {
  if (points < 100) {
    return {
      name: "Bronze Member",
      className: "text-amber-600",
      accentColor: "#d97706",
      bgGradient: "from-amber-900 via-stone-800 to-stone-900",
      borderGlow: "shadow-amber-900/30 border-amber-800/30",
      badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    };
  } else if (points < 300) {
    return {
      name: "Silver Member",
      className: "text-slate-400",
      accentColor: "#a1a1aa",
      bgGradient: "from-slate-800 via-zinc-800 to-zinc-900",
      borderGlow: "shadow-slate-500/10 border-slate-700/40",
      badgeBg: "bg-slate-400/10 text-slate-300 border-slate-400/20"
    };
  } else if (points < 600) {
    return {
      name: "Gold Member",
      className: "text-yellow-500 font-extrabold",
      accentColor: "#f59e0b",
      bgGradient: "from-amber-950 via-stone-900 to-yellow-950",
      borderGlow: "shadow-amber-500/25 border-amber-600/40",
      badgeBg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    };
  } else {
    return {
      name: "Platinum Elite",
      className: "text-indigo-400 font-black tracking-wider",
      accentColor: "#818cf8",
      bgGradient: "from-indigo-950 via-slate-900 to-zinc-950",
      borderGlow: "shadow-indigo-500/35 border-indigo-500/50",
      badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
    };
  }
}

function getTierProgress(points: number) {
  if (points < 100) {
    return {
      current: points,
      next: 100,
      needed: 100 - points,
      nextTier: "Silver Member",
      percent: Math.min(100, Math.max(0, (points / 100) * 100))
    };
  } else if (points < 300) {
    return {
      current: points,
      next: 300,
      needed: 300 - points,
      nextTier: "Gold Member",
      percent: Math.min(100, Math.max(0, ((points - 100) / 200) * 100))
    };
  } else if (points < 600) {
    return {
      current: points,
      next: 600,
      needed: 600 - points,
      nextTier: "Platinum Elite",
      percent: Math.min(100, Math.max(0, ((points - 300) / 300) * 100))
    };
  } else {
    return {
      current: points,
      next: null,
      needed: 0,
      nextTier: null,
      percent: 100
    };
  }
}

function LoyaltyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [phoneInput, setPhoneInput] = useState("");
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<{ availablePoints: number; pendingPoints: number; nextExpiryDate: string | null; tierPoints?: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "EARN" | "REDEEM" | "BONUS">("ALL");

  // Check URL query parameters on mount
  useEffect(() => {
    let phone = searchParams.get("phone");
    if (!phone) {
      if (typeof window !== "undefined") {
        // 1. Check if the phone number is embedded in the pathname itself (e.g., /loyalty9310065542)
        const path = window.location.pathname;
        const pathMatch = path.match(/^\/loyalty(\d{10,15})$/);
        if (pathMatch) {
          phone = pathMatch[1];
        } else {
          // 2. Fallback to query string (e.g. /loyalty?9310065542)
          const query = window.location.search.substring(1);
          if (/^\d{10,15}$/.test(query)) {
            phone = query;
          }
        }
      }
    }
    
    if (phone) {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      setPhoneInput(cleanPhone);
      setSearchedPhone(cleanPhone);
      fetchLoyaltyData(cleanPhone);
    }
  }, [searchParams]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const fetchLoyaltyData = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch wallet balance
      const balanceRes = await fetch(`/api/loyalty/balance?phone=${phone}`);
      if (!balanceRes.ok) {
        const errData = await balanceRes.json();
        throw new Error(errData.error || "Failed to load loyalty wallet");
      }
      const balanceData = await balanceRes.json();
      setWallet({
        availablePoints: balanceData.availablePoints,
        pendingPoints: balanceData.pendingPoints,
        nextExpiryDate: balanceData.nextExpiryDate,
        tierPoints: balanceData.tierPoints ?? balanceData.availablePoints
      });

      // 2. Fetch recent transactions
      const txsRes = await fetch(`/api/loyalty/transactions?phone=${phone}`);
      if (txsRes.ok) {
        const txsData = await txsRes.json();
        setTransactions(txsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error fetching loyalty details");
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    router.push(`/loyalty?phone=${cleanPhone}`);
  };

  const tier = wallet ? getTierConfig(wallet.tierPoints ?? wallet.availablePoints) : null;
  const progress = wallet ? getTierProgress(wallet.tierPoints ?? wallet.availablePoints) : null;

  // Filter transactions
  const filteredTxs = transactions.filter(tx => {
    if (filter === "ALL") return true;
    if (filter === "EARN") return tx.type === "EARN";
    if (filter === "REDEEM") return tx.type === "REDEEM";
    if (filter === "BONUS") return tx.type === "BONUS";
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-warm-100/60 pb-24 font-sans antialiased">
      {/* Premium Hero Banner */}
      <div className="relative bg-zinc-950 text-white pt-24 pb-28 px-4 overflow-hidden shadow-2xl">
        {/* Decorative ambient blurs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Tech mesh grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl mb-5 shadow-lg shadow-red-500/20"
          >
            <Crown className="w-8 h-8 text-white animate-pulse" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-amber-300"
          >
            Hello Pizza Loyalty Club
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-zinc-400 text-sm md:text-lg font-medium max-w-xl mx-auto leading-relaxed"
          >
            Unlock elite rewards, track points, and access your exclusive loyalty benefits on every delicious slice.
          </motion.p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={`mx-auto px-4 -mt-12 relative z-20 w-full transition-all duration-500 ${wallet ? "max-w-7xl" : "max-w-xl"} space-y-8`}>
        
        {/* Search Panel (sleek banner at top when wallet loaded, or centered card when not) */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl shadow-warm-200/40 mx-auto transition-all duration-500 ${wallet ? "max-w-3xl" : "w-full"}`}
        >
          <div className={`flex flex-col ${wallet ? "sm:flex-row sm:items-center sm:justify-between gap-4" : "gap-3"}`}>
            <div>
              <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" /> 
                <span>{wallet ? "Check Another Account" : "Lookup Membership Wallet"}</span>
              </h2>
              {wallet && searchedPhone && (
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Currently viewing: <span className="font-bold text-red-600">{searchedPhone}</span>
                </p>
              )}
            </div>
            
            <form onSubmit={handleSearchSubmit} className={`flex gap-2.5 ${wallet ? "sm:w-2/3" : "w-full"}`}>
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter mobile number..."
                  className="w-full pl-4 pr-10 py-3 bg-warm-50/70 border border-warm-200/80 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 outline-none text-base font-semibold text-zinc-850 transition-all placeholder:text-zinc-400"
                />
                <Shield className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-300 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold hover:brightness-105 active:scale-95 transition-all shadow-md shadow-red-500/10 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-xs font-semibold mt-3 flex items-center gap-1.5"
              >
                <span>⚠</span> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-12 text-center border border-warm-200/50 shadow-lg max-w-md mx-auto"
            >
              <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-bold text-zinc-700">Verifying secure credentials...</p>
              <p className="text-zinc-400 text-xs mt-1">Retrieving wallet database records</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two Section Layout: Left (Balance & Tiers), Right (History) */}
        {!loading && wallet && tier && progress && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SECTION: Available Balance Card & Tier Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 space-y-6"
            >
              
              {/* Premium Membership Card */}
              <motion.div 
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`bg-gradient-to-br ${tier.bgGradient} rounded-3xl p-7 text-white shadow-2xl relative overflow-hidden border ${tier.borderGlow}`}
              >
                {/* Glossy shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-30 pointer-events-none" />
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Chip / Hologram */}
                <div className="absolute right-6 top-6 w-12 h-9 bg-white/10 rounded-lg backdrop-blur-md border border-white/15 flex items-center justify-center pointer-events-none">
                  <Sparkles className="w-5 h-5 text-yellow-300/80 animate-pulse" />
                </div>

                <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/65">
                        HELLO PIZZA MEMBERSHIP
                      </span>
                    </div>
                    
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${tier.badgeBg}`}>
                      {tier.name}
                    </span>
                  </div>

                  <div className="space-y-1 my-2">
                    <div className="text-xs text-white/60 font-semibold tracking-wide uppercase">AVAILABLE BALANCE</div>
                    <div className="text-6xl font-black flex items-baseline gap-2 text-white drop-shadow-md">
                      <span>{wallet.availablePoints}</span>
                      <span className="text-xl font-bold text-yellow-400">Pts</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/15 text-sm">
                    <div>
                      <div className="text-xs text-white/55 mb-1 font-medium">Locked (Pending)</div>
                      <div className="font-bold text-white/90 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-white/60" />
                        <span>{wallet.pendingPoints} Pts</span>
                      </div>
                    </div>
                    {wallet.nextExpiryDate && (
                      <div>
                        <div className="text-xs text-white/55 mb-1 font-medium">Next Expiry Date</div>
                        <div className="font-bold text-white/90 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-white/60" />
                          <span>{formatDate(wallet.nextExpiryDate)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Progress to Next Tier Card */}
              <div className="bg-white rounded-3xl p-6 border border-warm-200/50 shadow-lg shadow-warm-200/30 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-700">Tier Status Progress</span>
                  {progress.next ? (
                    <span className="text-xs font-semibold text-zinc-400">
                      {progress.current} / {progress.next} Pts
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> Max Tier Reached
                    </span>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  />
                </div>

                {progress.nextTier ? (
                  <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-red-500 shrink-0" />
                    <span>
                      Earn <strong className="text-zinc-800">{progress.needed} more points</strong> to unlock the <strong className="text-red-600 font-semibold">{progress.nextTier}</strong> tier!
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>You are a <strong className="text-indigo-600">Platinum Elite</strong> member! Enjoy the ultimate loyalty bonuses.</span>
                  </p>
                )}

                {wallet.tierPoints !== undefined && wallet.tierPoints > wallet.availablePoints && (
                  <div className="bg-amber-50/80 text-amber-900 text-[11px] p-3.5 rounded-2xl border border-amber-200/40 flex gap-2.5 items-start mt-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Tier Grace Period Active</span>
                      Your <span className="font-semibold text-zinc-900">{tier.name}</span> status is currently protected by a 10-day relaxation period following point redemption or expiration. Place a new order to restore your points and secure your rank!
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats & Rules Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-warm-200/50 shadow-md shadow-warm-100/50 flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Redemption Rate</div>
                    <div className="text-sm font-black text-zinc-800">1 Pt = ₹1.00 Value</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 border border-warm-200/50 shadow-md shadow-warm-100/50 flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Point Validity</div>
                    <div className="text-sm font-black text-zinc-800">30 Days Expiry</div>
                  </div>
                </div>
              </div>

            </motion.div>

            {/* RIGHT SECTION: Chronological Ledger / History */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7 w-full"
            >
              <div className="bg-white rounded-3xl border border-warm-200/50 shadow-xl shadow-warm-200/40 p-6 space-y-6">
                
                {/* Header & Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4">
                  <h3 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-red-500" /> 
                    <span>Chronological Wallet Ledger</span>
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-zinc-50 p-1.2 rounded-xl border border-zinc-100">
                    {(["ALL", "EARN", "REDEEM", "BONUS"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filter === t 
                            ? "bg-white text-zinc-800 shadow-sm border border-zinc-200/50" 
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                      >
                        {t === "ALL" ? "All" : 
                         t === "EARN" ? "Earned" : 
                         t === "REDEEM" ? "Redeemed" : "Bonuses"}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Transactions List */}
                {filteredTxs.length === 0 ? (
                  <div className="text-center py-16 text-zinc-450 bg-warm-50/20 rounded-2xl border border-dashed border-warm-200/80">
                    <Clock className="w-10 h-10 text-zinc-350 mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-700">No loyalty activities matched</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Transactions will appear here after orders are placed, points are redeemed, or campaign bonuses are credited.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] lg:max-h-[580px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-warm-300">
                    <AnimatePresence mode="popLayout">
                      {filteredTxs.map((tx, idx) => {
                        const isPositive = tx.points > 0;
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: 0.03 * Math.min(idx, 8), duration: 0.2 }}
                            key={tx.id}
                            className="flex justify-between items-center p-4 bg-warm-50/35 hover:bg-warm-50/85 rounded-2xl border border-warm-100/70 transition-all hover:scale-[1.005] hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`p-2.5 rounded-xl shrink-0 ${
                                tx.type === "REDEEM" ? "bg-red-50 text-red-600" :
                                tx.type === "BONUS" ? "bg-purple-50 text-purple-600" :
                                "bg-emerald-50 text-emerald-600"
                              }`}>
                                {tx.type === "REDEEM" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              
                              <div>
                                <div className="text-sm font-bold text-zinc-800">
                                  {tx.type === "REDEEM" ? "Points Redeemed" :
                                   tx.type === "BONUS" ? "Campaign Bonus Credited" : "Points Earned"}
                                </div>
                                
                                <div className="text-[10px] text-zinc-450 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                                  <span className="flex items-center gap-1 text-zinc-400">
                                    <Calendar className="w-3.5 h-3.5" /> 
                                    <span>{formatDate(tx.timestamp)}</span>
                                  </span>
                                  
                                  {tx.orderId && (
                                    <span className="px-1.5 py-0.5 bg-warm-100/80 rounded text-[9px] font-bold text-zinc-500 border border-warm-200/40">
                                      ID: {tx.orderId.substring(0, 8)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-base font-black shrink-0 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                              {isPositive ? `+${tx.points}` : tx.points}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
                
              </div>

              {/* Tier Definitions & Benefits Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-3xl border border-warm-200/50 shadow-xl shadow-warm-200/40 p-6 mt-6 space-y-5"
              >
                <div className="border-b border-zinc-100 pb-3.5">
                  <h3 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <span>Loyalty Club Tiers & Benefits</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Accumulate points to unlock higher membership tiers and unlock premium benefits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Bronze Member",
                      range: "0 – 99 Pts",
                      color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
                      benefits: ["Earn 1 Pt per ₹1.00 spent", "Redeem points directly on checkout", "Digital receipt records"]
                    },
                    {
                      name: "Silver Member",
                      range: "100 – 299 Pts",
                      color: "text-slate-505 bg-slate-400/10 border-slate-400/20",
                      benefits: ["Earn 10% bonus loyalty points", "Priority customer support"]
                    },
                    {
                      name: "Gold Member",
                      range: "300 – 599 Pts",
                      color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
                      benefits: ["Earn 20% bonus loyalty points", "Priority service status"]
                    },
                    {
                      name: "Platinum Elite",
                      range: "600+ Pts",
                      color: "text-indigo-650 bg-indigo-500/10 border-indigo-500/20",
                      benefits: ["Earn 30% bonus loyalty points", "Dedicated customer care priority"]
                    }
                  ].map((t) => (
                    <div 
                      key={t.name}
                      className="p-4 rounded-2xl border bg-warm-50/20 border-warm-200/50 flex flex-col justify-between hover:bg-white transition-all duration-300 hover:shadow-md hover:border-warm-300"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${t.color}`}>
                            {t.name}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg">
                            {t.range}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {t.benefits.map((b, i) => (
                            <li key={i} className="text-[11px] text-zinc-500 flex items-start gap-1.5 font-medium leading-relaxed">
                              <span className="text-emerald-500 font-bold select-none shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoyaltyContent />
    </Suspense>
  );
}
