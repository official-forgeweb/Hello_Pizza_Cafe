"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, Phone, Mail, MapPin, UserCheck, ShoppingBag,
  DollarSign, RefreshCw, Calendar, Users,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  completedOrders: number;
  totalSpend: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch {
      console.error("Failed to fetch customers");
    }
    setLoading(false);
    setRefreshing(false);
  }, [searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchCustomers(false), 30000);
    return () => clearInterval(interval);
  }, [fetchCustomers]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalSpendAll = customers.reduce((sum, c) => sum + c.totalSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Customers</h1>
          <p className="text-warm-500 text-sm mt-1">
            {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <motion.button
          onClick={() => fetchCustomers(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-medium text-warm-700 hover:bg-warm-50 cursor-pointer disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warm-900">{loading ? "—" : customers.length}</p>
          <p className="text-xs text-warm-500 mt-1">Total Customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warm-900">
            {loading ? "—" : `₹${Math.round(totalSpendAll).toLocaleString()}`}
          </p>
          <p className="text-xs text-warm-500 mt-1">Total Revenue from Customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60 col-span-2 md:col-span-1"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warm-900">
            {loading ? "—" : customers.length > 0 
              ? (customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length).toFixed(1) 
              : "0"
            }
          </p>
          <p className="text-xs text-warm-500 mt-1">Avg Orders / Customer</p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400"
        />
      </div>

      {/* Customer Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-warm-700">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60">
            <UserCheck className="w-12 h-12 text-warm-300 mx-auto mb-3" />
            <p className="font-semibold text-warm-700">No customers found</p>
            <p className="text-warm-500 text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Customers will appear here after orders are accepted"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customers.map((customer, i) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="bg-white rounded-2xl border border-warm-200/60 p-5 hover:shadow-md transition-shadow"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Customer Name & Avatar */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#cc1530] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-warm-900 text-sm truncate">{customer.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-warm-400" />
                      <p className="text-xs text-warm-500">Since {formatDate(customer.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-warm-600">
                    <Phone className="w-3.5 h-3.5 text-warm-400" />
                    <a href={`tel:${customer.phone}`} className="hover:text-primary transition-colors">
                      {customer.phone}
                    </a>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-warm-600">
                      <Mail className="w-3.5 h-3.5 text-warm-400" />
                      <a href={`mailto:${customer.email}`} className="hover:text-primary transition-colors truncate">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm text-warm-600">
                      <MapPin className="w-3.5 h-3.5 text-warm-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-0 border-t border-warm-100 pt-3">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-warm-900">{customer.totalOrders}</p>
                    <p className="text-[10px] text-warm-500 uppercase tracking-wider">Orders</p>
                  </div>
                  <div className="w-px h-8 bg-warm-200" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-emerald-600">₹{Math.round(customer.totalSpend).toLocaleString()}</p>
                    <p className="text-[10px] text-warm-500 uppercase tracking-wider">Spent</p>
                  </div>
                  <div className="w-px h-8 bg-warm-200" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-warm-900">
                      {customer.totalOrders > 0 ? `₹${Math.round(customer.totalSpend / customer.totalOrders)}` : "—"}
                    </p>
                    <p className="text-[10px] text-warm-500 uppercase tracking-wider">Avg</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
