"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag, DollarSign, Users, TrendingUp, Clock, Package,
  CheckCircle2, XCircle, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmed", class: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "Preparing", class: "bg-orange-100 text-orange-700" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", class: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Delivered", class: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", class: "bg-red-100 text-red-700" },
};

// Blank default stats for empty database
const DEFAULT_STATS = {
  stats: { todayOrders: 0, todayRevenue: 0, totalOrders: 0, activeStaff: 0, avgOrderValue: 0 },
  dailyRevenue: [
    { day: "Mon", revenue: 0, orders: 0 },
    { day: "Tue", revenue: 0, orders: 0 },
    { day: "Wed", revenue: 0, orders: 0 },
    { day: "Thu", revenue: 0, orders: 0 },
    { day: "Fri", revenue: 0, orders: 0 },
    { day: "Sat", revenue: 0, orders: 0 },
    { day: "Sun", revenue: 0, orders: 0 },
  ],
  topItems: [],
  recentOrders: [],
};

export default function AdminDashboard() {
  const [data, setData] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  // Auto-refresh function to keep dashboard completely live
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const apiData = await res.json();
          // Merge default dailyRevenue structure with fetched stats just in case it's empty
          setData({
             ...apiData,
             dailyRevenue: apiData.dailyRevenue?.length > 0 ? apiData.dailyRevenue.reverse() : DEFAULT_STATS.dailyRevenue
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
      setLoading(false);
    };

    // Initial load
    fetchDashboard();

    // Re-fetch every 30 seconds for live updates
    const intervalId = setInterval(fetchDashboard, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const STATS = [
    {
      title: "Today's Orders",
      value: data.stats.todayOrders.toString(),
      icon: ShoppingBag,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-500/10",
    },
    {
      title: "Today's Revenue",
      value: `₹${data.stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-500/10",
    },
    {
      title: "Avg Order Value",
      value: `₹${data.stats.avgOrderValue}`,
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-500/10",
    },
    {
      title: "Active Staff",
      value: data.stats.activeStaff.toString(),
      icon: Users,
      gradient: "from-orange-500 to-orange-600",
      bgLight: "bg-orange-500/10",
    },
  ];

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Dashboard</h1>
        <p className="text-warm-500 text-sm mt-1">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 border border-warm-200/60 hover:shadow-md transition-shadow"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgLight}`}>
                <stat.icon className={`w-5 h-5 bg-gradient-to-r ${stat.gradient} bg-clip-text`} style={{ color: `var(--tw-gradient-from)` }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-warm-900">{loading ? "—" : stat.value}</p>
            <p className="text-xs text-warm-500 mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 border border-warm-200/60"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-warm-900">Revenue Overview</h2>
            <p className="text-xs text-warm-500 mt-0.5">Last 7 days</p>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e31837" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e31837" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a8a29e" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#a8a29e" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: "#1c1917", border: "none", borderRadius: "12px",
                  padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
                labelStyle={{ color: "#a8a29e", fontSize: 11, fontWeight: 600 }}
                itemStyle={{ color: "#fff", fontSize: 13, fontWeight: 700 }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#e31837" strokeWidth={2.5}
                fill="url(#revenueGradient)" dot={false} activeDot={{ r: 6, fill: "#e31837", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-warm-200/60 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="p-5 border-b border-warm-100 flex items-center justify-between">
            <h2 className="font-semibold text-warm-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-warm-100">
            {data.recentOrders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-warm-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-warm-800 text-sm">{order.id}</span>
                      <span className="text-warm-400 text-xs">{formatTime(order.time)}</span>
                    </div>
                    <p className="text-warm-500 text-xs mt-0.5">
                      {order.customer} • {order.items} items
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${status.class}`}>
                    {status.label}
                  </span>
                  <span className="font-semibold text-warm-800 text-sm">₹{order.total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="p-5 border-b border-warm-100">
            <h2 className="font-semibold text-warm-900">Top Selling Items</h2>
            <p className="text-xs text-warm-500 mt-0.5">All time</p>
          </div>
          <div className="divide-y divide-warm-100">
            {data.topItems.map((item, i) => (
              <div key={item.name} className="px-5 py-3.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-xs font-bold text-warm-600">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{item.name}</p>
                  <p className="text-xs text-warm-500">{item.orders} orders</p>
                </div>
                <span className="text-sm font-semibold text-warm-700">
                  ₹{item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
