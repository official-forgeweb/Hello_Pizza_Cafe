/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Phone, Mail, UserCheck, ShoppingBag,
  DollarSign, RefreshCw, Calendar, Users, Filter, Upload,
  X, Check, AlertCircle, MessageSquare, Trash2, AlertTriangle,
  Eye, ArrowLeft
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  whatsappOptIn: boolean;
  group: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  completedOrders: number;
  totalSpend: number;
  lastOrderDate: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalCustomers: number;
    optedInCount: number;
    totalRevenue: number;
    avgOrders: number;
  }>({
    totalCustomers: 0,
    optedInCount: 0,
    totalRevenue: 0,
    avgOrders: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [optInFilter, setOptInFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Advanced Filters & Selection state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [marketingStatusFilter, setMarketingStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [createdDateFilter, setCreatedDateFilter] = useState("all");
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  
  // Advanced Spent & Recency Range state
  const [minSpent, setMinSpent] = useState("0");
  const [maxSpent, setMaxSpent] = useState("20000");
  const [minDays, setMinDays] = useState("0");
  const [maxDays, setMaxDays] = useState("365");
  const [debouncedMinSpent, setDebouncedMinSpent] = useState(0);
  const [debouncedMaxSpent, setDebouncedMaxSpent] = useState(20000);
  const [debouncedMinDays, setDebouncedMinDays] = useState(0);
  const [debouncedMaxDays, setDebouncedMaxDays] = useState(365);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showOptInFloating, setShowOptInFloating] = useState(false);

  // Batch Tagging Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState("");
  const [isBatching, setIsBatching] = useState(false);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Opt-In and Toast Notification state
  const [bulkUpdating, setBulkUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Manage Batches Modal state
  const [showManageBatchModal, setShowManageBatchModal] = useState(false);
  const [batches, setBatches] = useState<{ name: string; count: number }[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batchMembers, setBatchMembers] = useState<Customer[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/customers/tags");
      if (res.ok) {
        setUniqueTags(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Debounce search input and range sliders to avoid list re-rendering and querying on every keystroke/drag
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      
      const parsedMinSpent = minSpent === "" ? 0 : parseFloat(minSpent);
      const parsedMaxSpent = maxSpent === "" ? 20000 : parseFloat(maxSpent);
      const parsedMinDays = minDays === "" ? 0 : parseInt(minDays);
      const parsedMaxDays = maxDays === "" ? 365 : parseInt(maxDays);

      setDebouncedMinSpent(isNaN(parsedMinSpent) ? 0 : parsedMinSpent);
      setDebouncedMaxSpent(isNaN(parsedMaxSpent) ? 20000 : parsedMaxSpent);
      setDebouncedMinDays(isNaN(parsedMinDays) ? 0 : parsedMinDays);
      setDebouncedMaxDays(isNaN(parsedMaxDays) ? 365 : parsedMaxDays);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchInput, minSpent, maxSpent, minDays, maxDays]);

  // Clear selections when filters, ranges or page changes
  useEffect(() => {
    setSelectedCustomerIds(new Set());
  }, [
    searchQuery, groupFilter, optInFilter, marketingStatusFilter, tagFilter, createdDateFilter, page,
    debouncedMinSpent, debouncedMaxSpent, debouncedMinDays, debouncedMaxDays
  ]);

  const handleBulkOptIn = async (group: string) => {
    setBulkUpdating(group);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchCustomers(true);
        setToast({
          message: `Successfully opted-in ${data.count} customers in "${group === 'all' ? 'All' : group}" group!`,
          type: "success"
        });
      } else {
        const data = await res.json();
        setToast({
          message: data.error || "Failed to bulk update customers",
          type: "error"
        });
      }
    } catch (error: any) {
      setToast({
        message: error.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setBulkUpdating(null);
    }
  };

  const handleToggleOptIn = useCallback(async (customerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappOptIn: !currentStatus }),
      });
      if (res.ok) {
        setCustomers(prev => 
          prev.map(c => c.id === customerId ? { ...c, whatsappOptIn: !currentStatus } : c)
        );
      }
    } catch (error) {
      console.error("Failed to toggle opt-in status:", error);
    }
  }, []);

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
        setDeletingCustomer(null);
        fetchTags();
      } else {
        const data = await res.json();
        console.error("Delete failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
    setIsDeleting(false);
  };

  const handleToggleSelectCustomer = useCallback((id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = () => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      const allPageSelected = customers.length > 0 && customers.every(c => next.has(c.id));
      if (allPageSelected) {
        customers.forEach(c => next.delete(c.id));
      } else {
        customers.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleGenerateBatches = async () => {
    if (!batchPrefix.trim()) return;
    const targetCount = selectedCustomerIds.size > 0 ? selectedOptedInCount : stats.optedInCount;
    if (targetCount === 0) {
      setToast({
        message: "No opted-in customers found to batch.",
        type: "error"
      });
      return;
    }
    setIsBatching(true);
    try {
      const requestBody: any = {
        prefix: batchPrefix.trim()
      };

      if (selectedCustomerIds.size > 0) {
        requestBody.customerIds = Array.from(selectedCustomerIds);
      } else {
        requestBody.filters = {
          q: searchQuery,
          group: groupFilter,
          optIn: optInFilter,
          marketingStatus: marketingStatusFilter,
          tag: tagFilter,
          createdDate: createdDateFilter,
          minSpent: debouncedMinSpent,
          maxSpent: debouncedMaxSpent,
          minDays: debouncedMinDays,
          maxDays: debouncedMaxDays
        };
      }

      const res = await fetch("/api/admin/customers/batch-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      if (res.ok) {
        setToast({
          message: `Successfully tagged ${data.stats.totalTagged} customer(s) with tag '${data.stats.tags[0]}'!`,
          type: "success"
        });
        setShowBatchModal(false);
        setBatchPrefix("");
        setSelectedCustomerIds(new Set());
        fetchCustomers(true);
        fetchTags();
      } else {
        setToast({
          message: data.error || "Failed to generate batches",
          type: "error"
        });
      }
    } catch (error: any) {
      setToast({
        message: error.message || "An error occurred",
        type: "error"
      });
    } finally {
      setIsBatching(false);
    }
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch("/api/admin/customers/batches");
      if (res.ok) {
        setBatches(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchBatchMembers = async (tagName: string) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/admin/customers?tag=${encodeURIComponent(tagName)}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        setBatchMembers(data.customers || []);
      }
    } catch (error) {
      console.error("Failed to fetch batch members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteBatch = async (tagName: string) => {
    setDeletingBatch(tagName);
    try {
      const res = await fetch(`/api/admin/customers/batches?tag=${encodeURIComponent(tagName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setToast({
          message: data.message || `Successfully deleted batch ${tagName}`,
          type: "success"
        });
        if (selectedBatch === tagName) {
          setSelectedBatch(null);
          setBatchMembers([]);
        }
        fetchBatches();
        fetchTags();
        fetchCustomers(true);
      } else {
        const data = await res.json();
        setToast({
          message: data.error || "Failed to delete batch",
          type: "error"
        });
      }
    } catch (error: any) {
      setToast({
        message: error.message || "An error occurred",
        type: "error"
      });
    } finally {
      setDeletingBatch(null);
      setConfirmDeleteBatch(null);
    }
  };

  const fetchCustomers = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("page", page.toString());
      if (groupFilter !== "all") params.set("group", groupFilter);
      if (optInFilter) params.set("optIn", optInFilter);
      if (marketingStatusFilter !== "all") params.set("marketingStatus", marketingStatusFilter);
      if (tagFilter !== "all") params.set("tag", tagFilter);
      if (createdDateFilter !== "all") params.set("createdDate", createdDateFilter);
      if (debouncedMinSpent > 0) params.set("minSpent", debouncedMinSpent.toString());
      if (debouncedMaxSpent < 20000) params.set("maxSpent", debouncedMaxSpent.toString());
      if (debouncedMinDays > 0) params.set("minDays", debouncedMinDays.toString());
      if (debouncedMaxDays < 365) params.set("maxDays", debouncedMaxDays.toString());

      console.log("FRONTEND fetchCustomers URL:", `/api/admin/customers?${params.toString()}`);
      const res = await fetch(`/api/admin/customers?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.customers) {
          setCustomers(data.customers);
          setTotalPages(data.pagination.totalPages);
          if (data.stats) {
            setStats(data.stats);
          }
        } else {
          setCustomers(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
    setLoading(false);
    setRefreshing(false);
  }, [
    searchQuery, page, groupFilter, optInFilter, marketingStatusFilter, tagFilter, createdDateFilter,
    debouncedMinSpent, debouncedMaxSpent, debouncedMinDays, debouncedMaxDays
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/customers/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setImportResult(data);
      
      if (res.ok) {
        fetchCustomers(true);
      }
    } catch {
      setImportResult({ error: "Failed to upload file." });
    }

    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedOptedInCount = Array.from(selectedCustomerIds).filter(
    (phone) => customers.find((c) => c.phone === phone)?.whatsappOptIn
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Customers</h1>
          <p className="text-warm-500 text-sm mt-1">
            Manage your customer database and opt-ins
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-[#cc1530] transition-colors cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </motion.button>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 mb-3">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-warm-900">{loading ? "—" : stats.totalCustomers}</p>
          <p className="text-xs text-warm-500 mt-1">Total Customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#25D366]/10 mb-3">
            <MessageSquare className="w-5 h-5 text-[#25D366]" />
          </div>
          <p className="text-2xl font-bold text-warm-900">
            {loading ? "—" : stats.optedInCount}
          </p>
          <p className="text-xs text-warm-500 mt-1">WhatsApp Opt-ins</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-warm-900">
            {loading ? "—" : `₹${Math.round(stats.totalRevenue).toLocaleString()}`}
          </p>
          <p className="text-xs text-warm-500 mt-1">Total Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-warm-200/60 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 mb-3">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-warm-900">
            {loading ? "—" : stats.avgOrders}
          </p>
          <p className="text-xs text-warm-500 mt-1">Avg Orders</p>
        </motion.div>
      </div>



      {/* Filters */}
      <div className="space-y-4 bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-warm-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400"
            />
          </div>
          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
              showAdvancedPanel 
                ? "bg-primary/5 border-primary/20 text-primary animate-pulse" 
                : "bg-warm-50 hover:bg-warm-100 border-transparent text-warm-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced Ranges</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={groupFilter}
            onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-warm-50 border-0 rounded-xl text-xs text-warm-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="all">All Groups</option>
            <option value="new">New Group</option>
            <option value="regular">Regular Group</option>
            <option value="vip">VIP Group</option>
          </select>
          
          <select
            value={optInFilter}
            onChange={(e) => { setOptInFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-warm-50 border-0 rounded-xl text-xs text-warm-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="">Opt-In: Any</option>
            <option value="true">Opted In</option>
            <option value="false">Not Opted In</option>
          </select>

          <select
            value={marketingStatusFilter}
            onChange={(e) => { setMarketingStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-warm-50 border-0 rounded-xl text-xs text-warm-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="all">Marketing: All</option>
            <option value="never_sent">Never Sent Marketing</option>
            <option value="sent">Already Sent Marketing</option>
          </select>

          <select
            value={createdDateFilter}
            onChange={(e) => { setCreatedDateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-warm-50 border-0 rounded-xl text-xs text-warm-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="all">Import Date: Any</option>
            <option value="today">Imported Today</option>
            <option value="yesterday">Imported Yesterday</option>
            <option value="week">Imported This Week</option>
          </select>

          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-warm-50 border-0 rounded-xl text-xs text-warm-700 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="all">Tag: All</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Collapsible Advanced Slider Panel */}
        <AnimatePresence initial={false}>
          {showAdvancedPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 bg-warm-50/50 rounded-2xl border border-warm-200/50">
                {/* Spent Range Group */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-warm-700 uppercase tracking-wider">Amount Spent Range (₹)</span>
                    <span className="text-xs font-bold text-emerald-600">
                      ₹{Number(minSpent).toLocaleString()} - {Number(maxSpent) >= 20000 ? "₹20,000+" : `₹${Number(maxSpent).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="relative range-slider-container pt-3">
                    <div className="absolute h-1.5 w-full bg-warm-200 rounded-full top-[18px]" />
                    <div 
                      className="absolute h-1.5 bg-primary rounded-full top-[18px]" 
                      style={{
                        left: `${(Number(minSpent) / 20000) * 100}%`,
                        right: `${100 - (Number(maxSpent) / 20000) * 100}%`
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="100"
                      value={Number(minSpent) || 0}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), (Number(maxSpent) || 20000) - 100);
                        setMinSpent(val.toString());
                      }}
                      className="range-slider-input"
                      style={{ top: "16px" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="100"
                      value={Number(maxSpent) || 20000}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), (Number(minSpent) || 0) + 100);
                        setMaxSpent(val.toString());
                      }}
                      className="range-slider-input"
                      style={{ top: "16px" }}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-warm-400">Min (₹):</span>
                      <input
                        type="number"
                        min="0"
                        max="20000"
                        value={minSpent}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMinSpent(val.length > 1 && val.startsWith("0") ? val.replace(/^0+(?=\d)/, "") : val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          const val = Math.min(Math.max(0, Number(minSpent) || 0), (Number(maxSpent) || 20000) - 1);
                          setMinSpent(val.toString());
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-warm-400">Max (₹):</span>
                      <input
                        type="number"
                        min="0"
                        max="20000"
                        value={maxSpent}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMaxSpent(val.length > 1 && val.startsWith("0") ? val.replace(/^0+(?=\d)/, "") : val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          const val = Math.max((Number(minSpent) || 0) + 1, Math.min(20000, Number(maxSpent) || 20000));
                          setMaxSpent(val.toString());
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Recency Range Group */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-warm-700 uppercase tracking-wider">Last Order Recency (Days)</span>
                    <span className="text-xs font-bold text-primary">
                      {minDays} - {Number(maxDays) >= 365 ? "365+ days" : `${maxDays} days`}
                    </span>
                  </div>

                  <div className="relative range-slider-container pt-3">
                    <div className="absolute h-1.5 w-full bg-warm-200 rounded-full top-[18px]" />
                    <div 
                      className="absolute h-1.5 bg-primary rounded-full top-[18px]" 
                      style={{
                        left: `${(Number(minDays) / 365) * 100}%`,
                        right: `${100 - (Number(maxDays) / 365) * 100}%`
                      }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="365"
                      step="1"
                      value={Number(minDays) || 0}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), (Number(maxDays) || 365) - 1);
                        setMinDays(val.toString());
                      }}
                      className="range-slider-input"
                      style={{ top: "16px" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="365"
                      step="1"
                      value={Number(maxDays) || 365}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), (Number(minDays) || 0) + 1);
                        setMaxDays(val.toString());
                      }}
                      className="range-slider-input"
                      style={{ top: "16px" }}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-warm-400">Min (Days):</span>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={minDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMinDays(val.length > 1 && val.startsWith("0") ? val.replace(/^0+(?=\d)/, "") : val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          const val = Math.min(Math.max(0, Number(minDays) || 0), (Number(maxDays) || 365) - 1);
                          setMinDays(val.toString());
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-warm-400">Max (Days):</span>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={maxDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMaxDays(val.length > 1 && val.startsWith("0") ? val.replace(/^0+(?=\d)/, "") : val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          const val = Math.max((Number(minDays) || 0) + 1, Math.min(365, Number(maxDays) || 365));
                          setMaxDays(val.toString());
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-warm-50/50 p-4 rounded-2xl border border-warm-200/60 shadow-sm text-sm">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={customers.length > 0 && customers.every(c => selectedCustomerIds.has(c.id))}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 rounded border-warm-300 text-primary focus:ring-primary/20 cursor-pointer"
          />
          <span className="font-semibold text-warm-700">
            {selectedCustomerIds.size} customer{selectedCustomerIds.size !== 1 ? "s" : ""} selected
          </span>
          {selectedCustomerIds.size > 0 && (
            <button
              onClick={() => setSelectedCustomerIds(new Set())}
              className="text-xs font-bold text-warm-400 hover:text-warm-700 underline cursor-pointer border-0 bg-transparent"
            >
              Deselect All
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowManageBatchModal(true);
              fetchBatches();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-warm-200 text-warm-700 rounded-xl text-xs font-bold hover:bg-warm-50 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-warm-500" />
            Manage Batches
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#cc1530] transition-colors cursor-pointer border-0"
          >
            <Users className="w-3.5 h-3.5" />
            {selectedCustomerIds.size > 0 
              ? `Batch Selected (${selectedOptedInCount} Opted In)`
              : `Batch All Filtered (${stats.optedInCount} Opted In)`
            }
          </button>
        </div>
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
            <p className="text-warm-500 text-sm mt-1">Try a different search term or filter</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  isSelected={selectedCustomerIds.has(customer.id)}
                  onToggleSelectCustomer={handleToggleSelectCustomer}
                  onToggleOptIn={handleToggleOptIn}
                  onDeleteClick={setDeletingCustomer}
                />
              ))}
            </motion.div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-warm-200 bg-white rounded-xl disabled:opacity-50 text-sm font-medium"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-bold text-warm-700">Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border border-warm-200 bg-white rounded-xl disabled:opacity-50 text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isImporting && setShowImportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button
                onClick={() => !isImporting && setShowImportModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-warm-100 transition-colors"
                disabled={isImporting}
              >
                <X className="w-5 h-5 text-warm-500" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-warm-900">Import Customers</h2>
                <p className="text-sm text-warm-500 mt-1">
                  Upload an Excel or CSV file. Make sure it contains &apos;Name&apos; and &apos;Phone&apos; columns. Contacts will automatically be opted-in to WhatsApp.
                </p>
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl mb-6 flex gap-3 text-sm ${importResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {importResult.error ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
                  <div>
                    <p className="font-bold">{importResult.error || "Import Successful"}</p>
                    {importResult.message && <p className="mt-1">{importResult.message}</p>}
                  </div>
                </div>
              )}

              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full border-2 border-dashed border-warm-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-warm-50 hover:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm font-bold text-warm-700">Uploading & Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-warm-400" />
                    <span className="text-sm font-bold text-warm-700">Click to Browse Files</span>
                    <span className="text-xs text-warm-400">Supports .xlsx, .csv</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeletingCustomer(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-warm-900 mb-1">Delete Customer?</h2>
              <p className="text-sm text-warm-500 mb-4">
                This will permanently remove the customer from your database. They will no longer receive any WhatsApp marketing messages.
              </p>

              <div className="bg-warm-50 rounded-xl p-4 mb-6 space-y-1">
                <p className="text-sm font-bold text-warm-900">{deletingCustomer.name}</p>
                <p className="text-xs text-warm-500 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {deletingCustomer.phone}
                </p>
                {deletingCustomer.email && (
                  <p className="text-xs text-warm-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {deletingCustomer.email}
                  </p>
                )}
                <p className="text-xs text-warm-400 pt-1">
                  {deletingCustomer.totalOrders} order{deletingCustomer.totalOrders !== 1 ? "s" : ""} · ₹{Math.round(deletingCustomer.totalSpend || 0).toLocaleString()} spent
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingCustomer(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-warm-700 bg-warm-100 hover:bg-warm-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Tagging Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isBatching && setShowBatchModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button
                onClick={() => !isBatching && setShowBatchModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-warm-100 transition-colors border-0 bg-transparent"
                disabled={isBatching}
              >
                <X className="w-5 h-5 text-warm-500" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-warm-900">Generate Marketing Batches</h2>
                <p className="text-xs text-warm-500 mt-1">
                  {selectedCustomerIds.size > 0 
                    ? (selectedOptedInCount === 0
                      ? `None of the selected customers are opted-in for WhatsApp. Please opt them in first.`
                      : `This will tag the ${selectedOptedInCount} opted-in customer(s) (out of ${selectedCustomerIds.size} selected) with your batch name.`)
                    : (stats.optedInCount === 0
                      ? `No opted-in customers match your current filters. Please adjust your filters or opt customers in.`
                      : `This will tag the ${stats.optedInCount} opted-in customer(s) matching your current filters with your batch name.`)
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5 uppercase tracking-wider">Batch Tag Prefix</label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="e.g. promo-june"
                    className="w-full px-4 py-2.5 bg-warm-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono placeholder:font-sans placeholder:text-warm-400"
                  />
                  <p className="text-[10px] text-warm-400 mt-1">
                    Customers will be tagged with <span className="font-mono bg-warm-50 px-1 py-0.5 rounded">{batchPrefix || "prefix"}</span>. Only alphanumeric, hyphen and underscore characters allowed.
                  </p>
                </div>

                {/* Warning Alert if target count is 0 */}
                {((selectedCustomerIds.size > 0 ? selectedOptedInCount : stats.optedInCount) === 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No Opted-in Customers</p>
                      <p className="mt-0.5">
                        Marketing batches can only target opted-in contacts. Click the <strong>Opted Out</strong> badge on Sunil&apos;s card (or use the green WhatsApp button in the bottom right) to opt them in first.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowBatchModal(false)}
                    disabled={isBatching}
                    className="flex-1 py-2.5 rounded-xl font-bold text-warm-700 bg-warm-100 hover:bg-warm-200 transition-colors cursor-pointer disabled:opacity-50 border-0"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateBatches}
                    disabled={isBatching || !batchPrefix.trim() || (selectedCustomerIds.size > 0 ? selectedOptedInCount : stats.optedInCount) === 0}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border-0"
                  >
                    {isBatching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isBatching ? "Batching..." : "Generate"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Batches Modal */}
      <AnimatePresence>
        {showManageBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                if (!deletingBatch) {
                  setShowManageBatchModal(false);
                  setSelectedBatch(null);
                  setBatchMembers([]);
                  setMemberQuery("");
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-4xl h-[80vh] flex flex-col relative z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-warm-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-warm-900">Manage Batches</h2>
                    <p className="text-xs text-warm-500">View and manage marketing batch segments</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowManageBatchModal(false);
                    setSelectedBatch(null);
                    setBatchMembers([]);
                    setMemberQuery("");
                  }}
                  className="p-2 rounded-xl hover:bg-warm-100 transition-colors border-0 bg-transparent cursor-pointer"
                  disabled={!!deletingBatch}
                >
                  <X className="w-5 h-5 text-warm-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                {/* Left Pane - Batches List */}
                <div className={`col-span-1 md:col-span-5 flex flex-col min-h-0 ${selectedBatch ? 'hidden md:flex' : 'flex'}`}>
                  <h3 className="text-xs font-bold text-warm-700 uppercase tracking-wider mb-3">All Created Batches</h3>
                  
                  {loadingBatches ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
                      <span className="text-xs text-warm-500 font-medium">Loading batches...</span>
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-warm-200 rounded-2xl p-4 text-center">
                      <Users className="w-8 h-8 text-warm-300 mb-2" />
                      <p className="text-sm font-bold text-warm-700">No batches found</p>
                      <p className="text-xs text-warm-400 mt-1">Create one using the batch buttons on filtered lists.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {batches.map((batch) => (
                        <div
                          key={batch.name}
                          onClick={() => {
                            setSelectedBatch(batch.name);
                            setMemberQuery("");
                            fetchBatchMembers(batch.name);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                            selectedBatch === batch.name
                              ? 'bg-primary/5 border-primary/20 shadow-sm'
                              : 'bg-warm-50 hover:bg-warm-100/70 border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-xs font-mono font-bold text-warm-900 truncate">{batch.name}</p>
                            <p className="text-[10px] text-warm-500 mt-0.5 font-medium">{batch.count} customer{batch.count !== 1 ? 's' : ''}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedBatch(batch.name);
                                setMemberQuery("");
                                fetchBatchMembers(batch.name);
                              }}
                              title="View members"
                              className="p-1.5 rounded-lg text-warm-400 hover:text-primary hover:bg-white transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {confirmDeleteBatch === batch.name ? (
                              <div className="flex items-center gap-1 bg-white border border-red-200 rounded-lg p-0.5">
                                <button
                                  onClick={() => handleDeleteBatch(batch.name)}
                                  disabled={deletingBatch === batch.name}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer border-0 flex items-center gap-1"
                                >
                                  {deletingBatch === batch.name ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    'Confirm'
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteBatch(null)}
                                  disabled={deletingBatch === batch.name}
                                  className="px-1.5 py-1 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded text-[10px] font-bold transition-colors cursor-pointer border-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteBatch(batch.name)}
                                title="Delete batch tag"
                                className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-white transition-colors border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Pane - Selected Batch Members Detail */}
                <div className={`col-span-1 md:col-span-7 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-warm-100 pt-4 md:pt-0 pl-0 md:pl-6 ${!selectedBatch ? 'hidden md:flex' : 'flex'}`}>
                  {selectedBatch ? (
                    <div className="flex flex-col flex-1 min-h-0">
                      {/* Back button for mobile view */}
                      <button
                        onClick={() => setSelectedBatch(null)}
                        className="md:hidden flex items-center gap-1.5 text-xs font-bold text-warm-500 hover:text-warm-850 mb-3 border-0 bg-transparent cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Batches
                      </button>

                      {/* Header info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Viewing Members of</p>
                          <h4 className="text-sm font-mono font-bold text-warm-900 truncate">{selectedBatch}</h4>
                        </div>
                        <div className="relative w-full sm:w-48">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-400" />
                          <input
                            type="text"
                            placeholder="Find inside batch..."
                            value={memberQuery}
                            onChange={(e) => setMemberQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-warm-50 border-0 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400"
                          />
                        </div>
                      </div>

                      {/* Members List */}
                      {loadingMembers ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12">
                          <RefreshCw className="w-6 h-6 text-primary animate-spin mb-2" />
                          <span className="text-xs text-warm-500 font-medium">Fetching batch members...</span>
                        </div>
                      ) : (
                        (() => {
                          const filtered = batchMembers.filter(
                            (m) =>
                              (m.name || "").toLowerCase().includes(memberQuery.toLowerCase()) ||
                              (m.phone || "").includes(memberQuery)
                          );
                          return (
                            <div className="flex-1 overflow-y-auto min-h-0 border border-warm-100 rounded-2xl bg-warm-50/20 custom-scrollbar">
                              {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                  <Search className="w-6 h-6 text-warm-300 mb-2" />
                                  <p className="text-xs font-bold text-warm-700">No members match your search</p>
                                  <p className="text-[10px] text-warm-400 mt-0.5">Try searching another name or number.</p>
                                </div>
                              ) : (
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-warm-50 text-warm-500 font-bold border-b border-warm-100">
                                      <th className="p-3">Customer</th>
                                      <th className="p-3">Phone</th>
                                      <th className="p-3 text-right">Spend</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-warm-100">
                                    {filtered.map((member) => (
                                      <tr key={member.id} className="hover:bg-warm-50/50 transition-colors">
                                        <td className="p-3">
                                          <div className="font-bold text-warm-900">{member.name}</div>
                                          {member.group === 'vip' && (
                                            <span className="inline-block mt-0.5 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>
                                          )}
                                        </td>
                                        <td className="p-3 font-mono text-warm-600">{member.phone}</td>
                                        <td className="p-3 text-right font-semibold text-emerald-600">₹{Math.round(member.totalSpend || 0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                      <Users className="w-12 h-12 text-warm-200 mb-3" />
                      <h4 className="text-sm font-bold text-warm-700">Inspect Batch Members</h4>
                      <p className="text-xs text-warm-400 mt-1 max-w-xs">
                        Select any batch from the left list to see the full list of enrolled customers and their details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border border-warm-200/80 bg-white max-w-sm"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            }`}>
              {toast.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warm-900 leading-tight">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="text-xs text-warm-500 mt-1 leading-normal">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bulk WhatsApp Opt-In widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {showOptInFloating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-warm-200/80 shadow-2xl w-80 mb-3 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  <h3 className="font-bold text-warm-900 text-sm">Bulk WhatsApp Opt-In</h3>
                </div>
                <button
                  onClick={() => setShowOptInFloating(false)}
                  className="p-1 rounded-lg hover:bg-warm-100 transition-colors text-warm-400 hover:text-warm-700 cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-warm-550 leading-normal">
                Bulk subscribe customer groups to receive updates, promotions, and receipt notifications.
              </p>

              <div className="space-y-2">
                {/* Button: Opt-in All */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={bulkUpdating !== null}
                  onClick={() => handleBulkOptIn("all")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1fa952] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-[#25D366]/20 cursor-pointer border-0 w-full"
                >
                  {bulkUpdating === "all" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  {bulkUpdating === "all" ? "Opting In..." : "Opt-in All"}
                </motion.button>

                {/* Button: Opt-in VIP */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={bulkUpdating !== null}
                  onClick={() => handleBulkOptIn("vip")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-amber-500/20 cursor-pointer border-0 w-full"
                >
                  {bulkUpdating === "vip" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {bulkUpdating === "vip" ? "Opting In..." : "Opt-in VIP"}
                </motion.button>

                {/* Button: Opt-in Regular */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={bulkUpdating !== null}
                  onClick={() => handleBulkOptIn("regular")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-blue-500/20 cursor-pointer border-0 w-full"
                >
                  {bulkUpdating === "regular" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {bulkUpdating === "regular" ? "Opting In..." : "Opt-in Regular"}
                </motion.button>

                {/* Button: Opt-in New */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={bulkUpdating !== null}
                  onClick={() => handleBulkOptIn("new")}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-650 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-purple-500/20 cursor-pointer border-0 w-full"
                >
                  {bulkUpdating === "new" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {bulkUpdating === "new" ? "Opting In..." : "Opt-in New"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button (FAB) */}
        <motion.button
          onClick={() => setShowOptInFloating(!showOptInFloating)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#1fa952] text-white rounded-full shadow-2xl transition-colors cursor-pointer border-0 relative group"
        >
          <MessageSquare className="w-6 h-6" />
          
          {/* Tooltip on hover */}
          <span className="absolute right-16 bg-warm-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Bulk WhatsApp Opt-In
          </span>
        </motion.button>
      </div>
    </div>
  );
}

const CustomerCard = memo(({
  customer,
  isSelected,
  onToggleSelectCustomer,
  onToggleOptIn,
  onDeleteClick,
}: {
  customer: Customer;
  isSelected: boolean;
  onToggleSelectCustomer: (id: string) => void;
  onToggleOptIn: (id: string, currentStatus: boolean) => void;
  onDeleteClick: (customer: Customer) => void;
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-warm-200/60 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* WhatsApp Opt-in Badge (Click to toggle) */}
      <button
        onClick={() => onToggleOptIn(customer.id, customer.whatsappOptIn)}
        className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
          customer.whatsappOptIn 
            ? "bg-[#25D366] hover:bg-[#1fa952] text-white border-0" 
            : "bg-warm-100 hover:bg-warm-200 text-warm-600 border-0"
        }`}
      >
        {customer.whatsappOptIn ? (
          <>
            <Check className="w-3 h-3" /> Opted In
          </>
        ) : (
          <>
            <X className="w-3 h-3" /> Opted Out
          </>
        )}
      </button>

      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelectCustomer(customer.id)}
          className="w-4.5 h-4.5 rounded border-warm-300 text-primary focus:ring-primary/20 cursor-pointer"
        />
      </div>

       {/* Customer Name & Avatar */}
      <div className="flex items-start gap-3 mb-4 mt-2 pl-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#cc1530] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-warm-900 text-sm truncate">{customer.name}</h3>
            {customer.group === 'vip' && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">VIP</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-warm-400" />
            <p className="text-xs text-warm-500">Last Order: {formatDate(customer.lastOrderDate)}</p>
          </div>
        </div>
        {/* Delete button */}
        <button
          onClick={() => onDeleteClick(customer)}
          title="Delete customer"
          className="p-1.5 rounded-lg text-warm-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-0 border-t border-warm-100 pt-3">
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-warm-900">{customer.totalOrders || 0}</p>
          <p className="text-[10px] text-warm-500 uppercase tracking-wider">Orders</p>
        </div>
        <div className="w-px h-8 bg-warm-200" />
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-emerald-600">₹{Math.round(customer.totalSpend || 0).toLocaleString()}</p>
          <p className="text-[10px] text-warm-500 uppercase tracking-wider">Spent</p>
        </div>
      </div>
    </div>
  );
});
CustomerCard.displayName = "CustomerCard";
