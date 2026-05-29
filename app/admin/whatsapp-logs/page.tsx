"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertCircle,
  Send,
  Phone,
  FileText,
  Edit2,
  Trash2,
  Check,
  X,
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info,
  HelpCircle,
} from "lucide-react";
import { useAdminAlert } from "@/components/admin/AdminAlertProvider";

interface OrderRelation {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  cancellationReason?: string | null;
  assignedStaff?: {
    name: string;
    phone: string;
  } | null;
}

interface CustomerRelation {
  id: string;
  name: string;
  phone: string;
}

interface MessageLog {
  id: string;
  phone: string;
  messageType: string;
  templateUsed: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  orderId: string | null;
  customerId: string | null;
  order?: OrderRelation | null;
  customer?: CustomerRelation | null;
}

export default function WhatsAppLogsPage() {
  const { showConfirm } = useAdminAlert();

  // Logs state
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Testing panel state
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  // Edit Phone number modal/inline state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // Error modal state
  const [selectedError, setSelectedError] = useState<{
    logId: string;
    template: string;
    error: string;
    phone: string;
  } | null>(null);

  // Retry state
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        page: page.toString(),
        limit: "15",
      });

      const res = await fetch(`/api/admin/whatsapp/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        triggerToast("Failed to fetch logs.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error connecting to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  // Handle Search Trigger (debounced or on enter/button click)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Send test message
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      triggerToast("Please enter a phone number", "error");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/admin/whatsapp/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Test message ('hello_world') sent successfully!", "success");
        setTestPhone("");
        // Reload logs list to show the new test log entry
        fetchLogs();
      } else {
        // Show detailed Meta error in alert box
        triggerToast(data.error || "Meta rejected the test message.", "error");
        // Open detailed error modal immediately so they see why
        setSelectedError({
          logId: "test-err",
          template: "hello_world",
          error: data.error || "Failed to send test message via Meta",
          phone: testPhone,
        });
      }
    } catch (err: any) {
      triggerToast(err.message || "Connection failed.", "error");
    } finally {
      setTesting(false);
    }
  };

  // Resend / Retry Message log
  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await fetch("/api/admin/whatsapp/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Notification resent successfully!", "success");
        fetchLogs();
      } else {
        triggerToast(data.error || "Resend failed. Check Meta credentials.", "error");
        fetchLogs();
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to resend.", "error");
    } finally {
      setRetryingLogId(null);
    }
  };

  // Open inline phone edit
  const startEditingPhone = (log: MessageLog) => {
    setEditingLogId(log.id);
    setEditingPhone(log.phone);
  };

  // Save phone number edit
  const savePhoneUpdate = async (log: MessageLog) => {
    if (!editingPhone || editingPhone.length < 10) {
      triggerToast("Please enter a valid 10-digit number", "error");
      return;
    }

    setSavingPhone(true);
    try {
      const res = await fetch("/api/admin/whatsapp/logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: log.orderId,
          customerId: log.customerId,
          phone: editingPhone,
        }),
      });

      if (res.ok) {
        triggerToast("Phone number updated in database!", "success");
        setEditingLogId(null);
        fetchLogs();
      } else {
        const data = await res.json();
        triggerToast(data.error || "Failed to update phone number.", "error");
      }
    } catch (err) {
      triggerToast("Connection failed.", "error");
    } finally {
      setSavingPhone(false);
    }
  };

  // Stats calculation
  const stats = {
    total: totalCount,
    sent: logs.filter((l) => ["sent", "delivered", "read"].includes(l.status)).length,
    delivered: logs.filter((l) => ["delivered", "read"].includes(l.status)).length,
    read: logs.filter((l) => l.status === "read").length,
    failed: logs.filter((l) => l.status === "failed").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/50 px-2.5 py-1 rounded-full w-fit">
            <span className="flex">
              <Check className="w-3.5 h-3.5" />
              <Check className="w-3.5 h-3.5 -ml-2" />
            </span>
            Read
          </span>
        );
      case "delivered":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-2.5 py-1 rounded-full w-fit">
            <span className="flex">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <Check className="w-3.5 h-3.5 text-emerald-500 -ml-2" />
            </span>
            Delivered
          </span>
        );
      case "sent":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-warm-100 text-warm-700 border border-warm-200 px-2.5 py-1 rounded-full w-fit">
            <Check className="w-3.5 h-3.5 text-warm-500" />
            Sent
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full w-fit">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case "queued":
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full w-fit">
            <Clock className="w-3.5 h-3.5" />
            Queued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            WhatsApp Logs & Diagnostics
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            Debug delivery errors, resend order receipts, update typing mistakes on numbers, and run connectivity test runs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => (window.location.href = "/admin/templates")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Templates
          </button>
          <a
            href="https://business.facebook.com/wa/manage/message-templates/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Meta Business Suite
          </a>
        </div>
      </div>

      {/* Meta API credentials alert */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-amber-800">Intermittent WhatsApp Failures?</h3>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            Meta Cloud API requires a linked credit/debit card even during the free monthly conversation tiers.
            If your card expires or payment fails, Meta instantly rejects outgoing notifications with a billing error.
          </p>
        </div>
        <a
          href="https://business.facebook.com/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 flex-shrink-0"
        >
          Check Billing & Payment <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Top Section: Diagnostics Sender Box & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test message panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-warm-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-warm-900 flex items-center gap-2 mb-1.5">
              <Send className="w-4 h-4 text-primary" />
              WhatsApp Connection Test
            </h2>
            <p className="text-xs text-warm-500 leading-relaxed mb-4">
              Send a test message using the official Meta <code className="bg-warm-100 text-warm-800 px-1 py-0.5 rounded font-mono font-bold">hello_world</code> template.
              If this test succeeds, it confirms your access token, phone ID, and credit card standing are in good shape.
            </p>

            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-1.5 block">
                  Customer Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 919876543210 (with country code)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-warm-400 font-medium"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={testing}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366] hover:bg-[#1fa952] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Attempting Send...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test Message
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-warm-100 flex items-start gap-2.5 text-[11px] text-warm-500 leading-relaxed">
            <Info className="w-4 h-4 text-warm-400 flex-shrink-0 mt-0.5" />
            <span>
              The standard template is charged at Meta's utility tier conversation rate. Free tiers may apply depending on customer response status.
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-warm-500 block">
              Recent Logs Filtered
            </span>
            <div className="mt-2.5">
              <span className="text-3xl font-extrabold text-warm-900">{totalCount}</span>
              <p className="text-xs text-warm-400 mt-1">Total entries in view</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#25D366] block">
              Message Delivered
            </span>
            <div className="mt-2.5">
              <span className="text-3xl font-extrabold text-warm-900">
                {logs.filter((l) => ["delivered", "read"].includes(l.status)).length}
              </span>
              <p className="text-xs text-warm-400 mt-1">Delivered to recipient</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              Read / Opened
            </span>
            <div className="mt-2.5">
              <span className="text-3xl font-extrabold text-warm-900">
                {logs.filter((l) => l.status === "read").length}
              </span>
              <p className="text-xs text-warm-400 mt-1">Opened by customer</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-warm-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
              Failed Attempts
            </span>
            <div className="mt-2.5">
              <span className="text-3xl font-extrabold text-red-600">
                {logs.filter((l) => l.status === "failed").length}
              </span>
              <p className="text-xs text-warm-400 mt-1">Errors to investigate</p>
            </div>
            <div className="absolute -bottom-2 -right-2 text-red-100 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-20 h-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      <div className="bg-white rounded-2xl border border-warm-200/60 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 md:p-5 border-b border-warm-100 bg-warm-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="text"
                placeholder="Search phone, template, order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-warm-400 shadow-inner font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary hover:bg-[#cc1530] text-white text-sm font-bold rounded-xl shadow-md shadow-primary/10 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2 items-center w-full md:w-auto">
            <span className="text-xs font-bold text-warm-500 whitespace-nowrap hidden sm:inline">
              Filter by Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 focus:outline-none focus:ring-2 focus:ring-primary/25 w-full sm:w-auto cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>

            <button
              onClick={() => {
                setPage(1);
                fetchLogs();
              }}
              className="p-2.5 bg-white border border-warm-200 rounded-xl text-warm-600 hover:bg-warm-50 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-[#25D366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold text-warm-700 text-sm">Fetching detailed diagnostics logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-warm-300 mx-auto mb-3" />
              <p className="font-semibold text-warm-700">No message logs found</p>
              <p className="text-warm-500 text-xs mt-1">
                Try adjusting your filters or send a test message to trigger some activity.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-50/50 border-b border-warm-100 text-[10px] font-extrabold uppercase tracking-wider text-warm-500">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Recipient & Customer</th>
                  <th className="py-4 px-6">Order Reference</th>
                  <th className="py-4 px-6">Template Used</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Error/Fail Reason</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100/60 text-sm text-warm-700 font-medium">
                {logs.map((log) => {
                  const isFailed = log.status === "failed";
                  const isEditing = editingLogId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-warm-50/30 transition-colors ${
                        isFailed ? "bg-red-50/5 hover:bg-red-50/10" : ""
                      }`}
                    >
                      <td className="py-4 px-6 whitespace-nowrap text-xs text-warm-400">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 max-w-[200px]">
                              <Phone className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={editingPhone}
                                onChange={(e) => setEditingPhone(e.target.value)}
                                className="px-2 py-1 bg-white border border-warm-200 rounded-lg text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-primary/25"
                                placeholder="Edit phone"
                                autoFocus
                              />
                              <button
                                onClick={() => savePhoneUpdate(log)}
                                disabled={savingPhone}
                                className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                title="Save phone"
                              >
                                {savingPhone ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="p-1 bg-warm-200 text-warm-700 rounded hover:bg-warm-300 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-bold text-warm-900 group">
                              <Phone className="w-3.5 h-3.5 text-warm-400" />
                              <span>+{log.phone}</span>
                              {log.orderId && (
                                <button
                                  onClick={() => startEditingPhone(log)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-warm-100 rounded text-warm-400 hover:text-primary transition-all cursor-pointer"
                                  title="Edit number"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-warm-500">
                            {log.customer?.name || log.order?.customerName || "General Walk-in"}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        {log.order ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-warm-900 text-xs bg-warm-100 border border-warm-200/50 px-2 py-0.5 rounded">
                              {log.order.orderNumber}
                            </span>
                            {log.order.customerPhone === "0000000000" && (
                              <span className="block text-[10px] text-amber-600 font-bold">
                                POS Dummy Phone
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-warm-400 font-normal">No Order Reference</span>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap font-mono text-xs">
                        <span className="text-warm-500">{log.templateUsed || log.messageType}</span>
                      </td>

                      <td className="py-4 px-6">{getStatusBadge(log.status)}</td>

                      <td className="py-4 px-6 max-w-[280px]">
                        {log.errorMessage ? (
                          <button
                            onClick={() =>
                              setSelectedError({
                                logId: log.id,
                                template: log.templateUsed || log.messageType,
                                error: log.errorMessage || "",
                                phone: log.phone,
                              })
                            }
                            className="text-left font-semibold text-red-600 hover:text-red-700 hover:underline truncate block w-full text-xs"
                            title="Click to view details"
                          >
                            {log.errorMessage}
                          </button>
                        ) : (
                          <span className="text-xs text-warm-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          {isFailed && (
                            <button
                              onClick={() =>
                                setSelectedError({
                                  logId: log.id,
                                  template: log.templateUsed || log.messageType,
                                  error: log.errorMessage || "",
                                  phone: log.phone,
                                })
                              }
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingLogId === log.id}
                            className={`px-2.5 py-1 bg-warm-100 hover:bg-warm-200 text-warm-700 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 ${
                              isFailed ? "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20" : ""
                            }`}
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${retryingLogId === log.id ? "animate-spin" : ""}`}
                            />
                            {retryingLogId === log.id ? "Sending..." : "Resend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 md:p-5 border-t border-warm-100 bg-warm-50/30 flex items-center justify-between">
            <span className="text-xs text-warm-500 font-medium">
              Showing page <strong className="text-warm-800">{page}</strong> of{" "}
              <strong className="text-warm-800">{totalPages}</strong> ({totalCount} total entries)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-warm-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-warm-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      <AnimatePresence>
        {selectedError && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border border-warm-200 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-extrabold text-warm-900 text-base">Meta WhatsApp Error Details</h3>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className="p-1 hover:bg-warm-100 rounded-lg text-warm-400 hover:text-warm-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-medium text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm-400 block mb-1">
                    Failed Template / Action
                  </span>
                  <span className="font-mono text-xs bg-warm-100 text-warm-700 px-2 py-0.5 rounded border border-warm-200/50">
                    {selectedError.template}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm-400 block mb-1">
                    Recipient
                  </span>
                  <span className="text-warm-800 font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-warm-400" />
                    +{selectedError.phone}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm-400 block mb-1">
                    Meta API Exception / Error message
                  </span>
                  <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-2xl font-mono text-xs leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap select-all">
                    {selectedError.error}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-warm-100 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                {selectedError.logId !== "test-err" && (
                  <button
                    onClick={() => {
                      const id = selectedError.logId;
                      setSelectedError(null);
                      handleRetry(id);
                    }}
                    className="px-4 py-2 bg-[#25D366] hover:bg-[#1fa952] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Resend Message
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
