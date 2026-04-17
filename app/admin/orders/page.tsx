"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Package, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Search, Phone, MapPin, Truck, Store, RefreshCw, Loader2, UserCircle,
  Mail, Check, AlertTriangle,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  selectedSize: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  orderType: string;
  deliveryAddress: string | null;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  placedAt: string;
  estimatedPrepTime: number | null;
  items: OrderItem[];
  assignedStaffId: string | null;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", class: "bg-yellow-100 text-yellow-700", icon: Clock },
  { value: "CONFIRMED", label: "Confirmed", class: "bg-blue-100 text-blue-700", icon: Package },
  { value: "PREPARING", label: "Preparing", class: "bg-orange-100 text-orange-700", icon: Clock },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery", class: "bg-purple-100 text-purple-700", icon: Truck },
  { value: "DELIVERED", label: "Delivered", class: "bg-green-100 text-green-700", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Cancelled", class: "bg-red-100 text-red-700", icon: XCircle },
];

const FILTER_TABS = ["Pending", "All", "Active", "Completed", "Cancelled"];

export default function OrdersPage() {
  const { addToast } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data.map((o: any) => ({
            ...o,
            subtotal: Number(o.subtotal),
            taxAmount: Number(o.taxAmount),
            deliveryFee: Number(o.deliveryFee),
            discountAmount: Number(o.discountAmount),
            totalAmount: Number(o.totalAmount),
            items: o.items?.map((i: any) => ({
              ...i,
              unitPrice: Number(i.unitPrice),
              itemTotal: Number(i.itemTotal),
            })) || [],
          })));
        }
      }
    } catch {
      console.error("Failed to fetch orders");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff?role=ALL");
      if (res.ok) setStaff(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    fetchStaff();
  }, [fetchOrders]);

  // Auto-refresh every 15 seconds for near real-time feel
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(false), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Pending" && order.status === "PENDING") ||
      (activeFilter === "Active" && ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(order.status)) ||
      (activeFilter === "Completed" && order.status === "DELIVERED") ||
      (activeFilter === "Cancelled" && order.status === "CANCELLED");

    const matchesSearch =
      !searchQuery ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  const acceptOrder = async (orderId: string) => {
    setAcceptingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        addToast("Order Accepted Successfully ✅", "success");
        // Update the local order state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "CONFIRMED" } : o
          )
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        addToast(errorData.error || "Failed to accept order", "error");
      }
    } catch {
      addToast("Error occurred while accepting order", "error");
    }
    setAcceptingOrderId(null);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast(`Order status updated to ${newStatus}`, "success");
      }
    } catch {
      // Fallback: update locally
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const assignStaff = async (orderId: string, staffId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: staffId || null }),
      });
      addToast("Staff assigned", "success");
    } catch {}
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedStaffId: staffId || null } : o))
    );
  };

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Orders</h1>
          <p className="text-warm-500 text-sm mt-1">
            {orders.length} total • {pendingCount} pending • {orders.filter((o) => ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)).length} active
          </p>
        </div>
        <motion.button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm font-medium text-warm-700 hover:bg-warm-50 cursor-pointer disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Pending Orders Alert Banner */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingCount} order{pendingCount > 1 ? "s" : ""} waiting for acceptance
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Review and accept pending orders to begin preparation
            </p>
          </div>
          <button
            onClick={() => setActiveFilter("Pending")}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
          >
            View Pending
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex bg-warm-100 rounded-xl p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeFilter === tab ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-700"
              }`}
            >
              {tab}
              {tab === "Pending" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60">
            <Loader2 className="w-8 h-8 text-warm-300 mx-auto mb-3 animate-spin" />
            <p className="font-semibold text-warm-700">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60">
            <Package className="w-12 h-12 text-warm-300 mx-auto mb-3" />
            <p className="font-semibold text-warm-700">No orders found</p>
            <p className="text-warm-500 text-sm mt-1">
              {activeFilter === "Pending"
                ? "All caught up! No pending orders right now."
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = getStatusConfig(order.status);
            const isExpanded = expandedOrder === order.id;
            const isPending = order.status === "PENDING";
            const isAccepting = acceptingOrderId === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  isPending
                    ? "border-amber-200/80 ring-1 ring-amber-100"
                    : "border-warm-200/60"
                }`}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Order Header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full p-4 md:p-5 flex items-center gap-4 cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-warm-900 text-sm">{order.orderNumber}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.class}`}>
                        {status.label}
                      </span>
                      {order.orderType === "PICKUP" && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-warm-100 text-warm-600 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          Pickup
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 animate-pulse">
                          ⏳ Needs Acceptance
                        </span>
                      )}
                    </div>
                    <p className="text-warm-600 text-sm mt-1">
                      {order.customerName} • {formatTime(order.placedAt)}
                    </p>
                  </div>
                  <span className="font-bold text-warm-900 text-base">
                    ₹{Math.round(order.totalAmount)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-warm-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-400 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-warm-100 pt-4">
                        {/* Customer Info Card */}
                        <div className="bg-warm-50 rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">Customer Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-warm-700">
                              <UserCircle className="w-4 h-4 text-warm-400" />
                              <span className="font-medium">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-warm-600">
                              <Phone className="w-4 h-4 text-warm-400" />
                              <a href={`tel:${order.customerPhone}`} className="hover:text-primary transition-colors">
                                {order.customerPhone}
                              </a>
                            </div>
                            {order.customerEmail && (
                              <div className="flex items-center gap-2 text-sm text-warm-600">
                                <Mail className="w-4 h-4 text-warm-400" />
                                <a href={`mailto:${order.customerEmail}`} className="hover:text-primary transition-colors truncate">
                                  {order.customerEmail}
                                </a>
                              </div>
                            )}
                            {order.deliveryAddress && (
                              <div className="flex items-start gap-2 text-sm text-warm-600 md:col-span-2">
                                <MapPin className="w-4 h-4 text-warm-400 flex-shrink-0 mt-0.5" />
                                <span>{order.deliveryAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Staff Assignment */}
                        {staff.length > 0 && !["DELIVERED", "CANCELLED", "PENDING"].includes(order.status) && (
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-4 h-4 text-warm-400" />
                            <select
                              value={order.assignedStaffId || ""}
                              onChange={(e) => assignStaff(order.id, e.target.value)}
                              className="px-3 py-1.5 bg-warm-50 rounded-lg text-sm border border-warm-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="">Assign staff...</option>
                              {staff.filter((s) => s.role === "DELIVERY" || s.role === "KITCHEN").map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Items */}
                        <div className="bg-warm-50 rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">Items Ordered</h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-warm-700">{item.quantity}x {item.itemName}</span>
                                <span className="font-medium text-warm-800">₹{Math.round(item.itemTotal)}</span>
                              </div>
                            ))}
                            <div className="border-t border-warm-200 mt-2 pt-2 space-y-1">
                              <div className="flex justify-between text-xs text-warm-500">
                                <span>Subtotal</span><span>₹{Math.round(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-warm-500">
                                <span>Tax</span><span>₹{Math.round(order.taxAmount)}</span>
                              </div>
                              {Number(order.deliveryFee) > 0 && (
                                <div className="flex justify-between text-xs text-warm-500">
                                  <span>Delivery</span><span>₹{Math.round(order.deliveryFee)}</span>
                                </div>
                              )}
                              {Number(order.discountAmount) > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Discount</span><span>-₹{Math.round(order.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold text-warm-900 pt-1">
                                <span>Total</span><span>₹{Math.round(order.totalAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Accept Order Button (only for PENDING) */}
                        {isPending && (
                          <motion.button
                            onClick={() => acceptOrder(order.id)}
                            disabled={isAccepting}
                            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{
                              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                              boxShadow: "0 4px 12px -2px rgba(22, 163, 74, 0.3), 0 2px 6px -1px rgba(22, 163, 74, 0.2)",
                            }}
                            whileHover={{ scale: isAccepting ? 1 : 1.01 }}
                            whileTap={{ scale: isAccepting ? 1 : 0.98 }}
                          >
                            {isAccepting ? (
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Accepting Order...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" />
                                Accept Order
                              </span>
                            )}
                          </motion.button>
                        )}

                        {/* Status Update (for non-PENDING, non-terminal) */}
                        {!isPending && !["DELIVERED", "CANCELLED"].includes(order.status) && (
                          <div>
                            <h4 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                              {STATUS_OPTIONS.filter((s) => s.value !== "PENDING").map((s) => (
                                <button
                                  key={s.value}
                                  onClick={() => updateStatus(order.id, s.value)}
                                  disabled={s.value === order.status}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                    s.value === order.status
                                      ? `${s.class} border-transparent`
                                      : "border-warm-200 text-warm-600 hover:bg-warm-100"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
