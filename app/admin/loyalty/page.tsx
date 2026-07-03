"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  RefreshCw,
  Search,
  ArrowRightLeft,
  Calendar,
  Gift,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Send
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  phoneNumber: string;
  type: string;
  points: number;
  timestamp: string;
  expiryDate: string;
  orderId?: string | null;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

interface Stats {
  earnedToday: number;
  redeemedToday: number;
  activePoints: number;
  expiringSoon: number;
}

export default function LoyaltyLogsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    earnedToday: 0,
    redeemedToday: 0,
    activePoints: 0,
    expiringSoon: 0
  });
  const [expiringAlerts, setExpiringAlerts] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "expiring">("logs");
  const [tagPrefix, setTagPrefix] = useState("expiring-soon");
  const [isTagging, setIsTagging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoyaltyData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.append("search", searchQuery);
      if (typeFilter) query.append("type", typeFilter);

      const res = await fetch(`/api/admin/loyalty?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setExpiringAlerts(data.expiringAlerts || []);
        setStats(data.stats || {
          earnedToday: 0,
          redeemedToday: 0,
          activePoints: 0,
          expiringSoon: 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch loyalty data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, [typeFilter]);

  const handleSelectAll = () => {
    if (selectedCustomers.length === expiringAlerts.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(expiringAlerts.map(a => a.customerPhone));
    }
  };

  const handleToggleSelect = (phone: string) => {
    if (selectedCustomers.includes(phone)) {
      setSelectedCustomers(selectedCustomers.filter(p => p !== phone));
    } else {
      setSelectedCustomers([...selectedCustomers, phone]);
    }
  };

  const handleCreateBatchCampaign = async () => {
    if (selectedCustomers.length === 0 || !tagPrefix.trim()) return;
    setIsTagging(true);
    try {
      const res = await fetch("/api/admin/customers/batch-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: tagPrefix,
          customerIds: selectedCustomers
        })
      });
      if (res.ok) {
        const result = await res.json();
        const firstTag = result.stats?.tags?.[0] || tagPrefix;
        
        // Show success alert and redirect to campaign creator with the tag pre-filled
        alert(`Successfully grouped ${selectedCustomers.length} customers into tag '${firstTag}'. Redirecting to Campaign Creator...`);
        router.push(`/admin/campaigns?create=true&tag=${firstTag}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate marketing batch tag");
      }
    } catch (e: any) {
      alert("Error generating marketing batch: " + e.message);
    } finally {
      setIsTagging(false);
    }
  };

  // Trigger search on enter or button click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLoyaltyData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoyaltyData(true);
  };

  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case "EARN":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: TrendingUp,
          label: "Earned"
        };
      case "REDEEM":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-100",
          icon: TrendingDown,
          label: "Redeemed"
        };
      case "BONUS":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-100",
          icon: Gift,
          label: "Bonus"
        };
      case "EXPIRE":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-100",
          icon: AlertTriangle,
          label: "Expired"
        };
      default:
        return {
          bg: "bg-warm-50 text-warm-700 border-warm-100",
          icon: ArrowRightLeft,
          label: type
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
            <Coins className="w-7 h-7 text-primary animate-pulse" />
            Loyalty Program Monitor
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            Monitor real-time customer points ledger, credits, redemptions, and system activity logs.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 hover:bg-warm-50 text-warm-700 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-warm-500 text-xs font-bold uppercase tracking-wider">Total Wallet Circulation</span>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Coins className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-warm-900">{stats.activePoints} Pts</h3>
            <p className="text-[10px] text-warm-400 mt-1">Net positive value circulating in all customer wallets</p>
          </div>
        </motion.div>

        {/* Earned Today */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-warm-500 text-xs font-bold uppercase tracking-wider">Earned Today</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-650">+{stats.earnedToday} Pts</h3>
            <p className="text-[10px] text-warm-400 mt-1">Total points credited to customer wallets since midnight</p>
          </div>
        </motion.div>

        {/* Redeemed Today */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-warm-500 text-xs font-bold uppercase tracking-wider">Redeemed Today</span>
            <div className="p-2 bg-rose-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-rose-650">-{stats.redeemedToday} Pts</h3>
            <p className="text-[10px] text-warm-400 mt-1">Points redeemed as discounts during checkout today</p>
          </div>
        </motion.div>

        {/* Expiring Soon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-warm-500 text-xs font-bold uppercase tracking-wider">Expiring (Next 7 Days)</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-650">{stats.expiringSoon} Pts</h3>
            <p className="text-[10px] text-warm-400 mt-1">Earned points about to hit their validity expiration</p>
          </div>
        </motion.div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-warm-200">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-warm-500 hover:text-warm-850"
          }`}
        >
          All Activity Logs
        </button>
        <button
          onClick={() => setActiveTab("expiring")}
          className={`px-6 py-3 text-sm font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === "expiring"
              ? "border-primary text-primary"
              : "border-transparent text-warm-500 hover:text-warm-850"
          }`}
        >
          ⏳ Expiring Points Alerts
          {expiringAlerts.length > 0 && (
            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {expiringAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-2xl border border-warm-200/60 shadow-sm overflow-hidden">
        {activeTab === "logs" ? (
          <>
            {/* Toolbar */}
            <div className="p-5 border-b border-warm-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-warm-50/30">
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white text-warm-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-warm-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-warm-400" />
                  <span className="text-xs font-bold text-warm-500 uppercase tracking-wide">Type:</span>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white text-warm-800"
                >
                  <option value="">All Transactions</option>
                  <option value="EARN">Credits (Earn)</option>
                  <option value="REDEEM">Debits (Redeem)</option>
                  <option value="BONUS">Bonus Points</option>
                  <option value="EXPIRE">Expired Points</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-warm-700">Loading ledger entries...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center text-warm-500">
                  <Coins className="w-12 h-12 text-warm-300 mx-auto mb-3" />
                  <p className="font-semibold text-warm-850">No loyalty logs found</p>
                  <p className="text-xs text-warm-400 mt-1">Try relaxing your filters or check back later.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-50/50 text-[10px] font-black uppercase tracking-wider text-warm-500 border-b border-warm-100">
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-right">Points</th>
                      <th className="py-4 px-6">Transaction Date</th>
                      <th className="py-4 px-6">Lifespan / Expiry</th>
                      <th className="py-4 px-6">Order Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100/60 text-sm">
                    {transactions.map((tx) => {
                      const style = getTransactionTypeStyle(tx.type);
                      const Icon = style.icon;
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-warm-50/30 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-warm-900">{tx.customer?.name || "Walk-in Customer"}</div>
                            <div className="text-xs text-warm-500 font-mono mt-0.5">{tx.phoneNumber}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-xs font-bold ${style.bg}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {style.label}
                            </span>
                          </td>
                          <td className={`py-4 px-6 text-right font-bold text-base ${tx.points > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                          </td>
                          <td className="py-4 px-6 text-warm-600 font-medium text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-warm-400" />
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-semibold text-warm-500">
                            {tx.type === "EARN" || tx.type === "BONUS" ? (
                              <span className={new Date(tx.expiryDate) < new Date() ? "text-red-500" : "text-warm-600"}>
                                Exp: {new Date(tx.expiryDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-warm-300 font-normal">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {tx.orderId ? (
                              <Link
                                href={`/admin/orders?search=${tx.orderId}`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                              >
                                View Order <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-xs text-warm-400 font-normal">Manual / System</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Batch Action Banner */}
            <AnimatePresence>
              {selectedCustomers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-primary/5 border-b border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="text-xs font-bold text-warm-800">
                    Selected: <span className="text-primary">{selectedCustomers.length}</span> customer(s)
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Tag prefix (e.g. expiring-soon)"
                      value={tagPrefix}
                      onChange={(e) => setTagPrefix(e.target.value)}
                      className="px-3 py-1.5 border border-warm-250 rounded-xl text-xs outline-none focus:border-primary bg-white text-warm-900 font-mono w-48"
                    />
                    <button
                      onClick={handleCreateBatchCampaign}
                      disabled={isTagging || !tagPrefix}
                      className="px-4 py-2 bg-primary hover:bg-[#cc1530] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isTagging ? "Grouping..." : "Group & Create Campaign"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expiring Alerts Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-semibold text-warm-700">Loading alerts...</p>
                </div>
              ) : expiringAlerts.length === 0 ? (
                <div className="p-12 text-center text-warm-500">
                  <AlertTriangle className="w-12 h-12 text-warm-300 mx-auto mb-3" />
                  <p className="font-semibold text-warm-850">No upcoming expirations found</p>
                  <p className="text-xs text-warm-400 mt-1">All active customer points have a validity longer than 30 days.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-50/50 text-[10px] font-black uppercase tracking-wider text-warm-500 border-b border-warm-100">
                      <th className="py-4 px-6 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.length === expiringAlerts.length}
                          onChange={handleSelectAll}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6 text-right">Points Expiring</th>
                      <th className="py-4 px-6">Time Remaining</th>
                      <th className="py-4 px-6">Exact Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100/60 text-sm">
                    {expiringAlerts.map((alertItem) => {
                      const isSelected = selectedCustomers.includes(alertItem.customerPhone);
                      const urgencyClass = 
                        alertItem.daysRemaining <= 3 
                          ? "bg-rose-50 text-rose-700 border-rose-100" 
                          : alertItem.daysRemaining <= 7 
                          ? "bg-amber-50 text-amber-700 border-amber-100" 
                          : "bg-warm-50 text-warm-700 border-warm-100";
                      
                      return (
                        <motion.tr
                          key={`${alertItem.customerPhone}-${alertItem.expiryDate}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`hover:bg-warm-50/30 transition-colors ${isSelected ? "bg-primary/5 hover:bg-primary/5" : ""}`}
                        >
                          <td className="py-4 px-6 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(alertItem.customerPhone)}
                              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-warm-900">{alertItem.customerName}</div>
                            <div className="text-xs text-warm-500 font-mono mt-0.5">{alertItem.customerPhone}</div>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-rose-600">
                            {alertItem.points} Pts
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-xs font-bold ${urgencyClass}`}>
                              {alertItem.daysRemaining === 1 ? "Expiring tomorrow" : `Expires in ${alertItem.daysRemaining} days`}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-warm-600 font-medium text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-warm-400" />
                              {new Date(alertItem.expiryDate).toLocaleDateString()}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
