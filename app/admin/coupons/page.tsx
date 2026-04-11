"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Tag, Edit2, Trash2, X, Save, Loader2, Copy,
  CheckCheck, Calendar, Percent,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount: number | null;
  minimumOrder: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

type EditCoupon = Partial<Coupon> & { isNew?: boolean };

const MOCK_COUPONS: Coupon[] = [
  { id: "1", code: "HELLO20", description: "20% off on all orders", discountType: "PERCENTAGE", discountValue: 20, maxDiscount: 150, minimumOrder: 299, usageLimit: 1000, usageCount: 234, isActive: true, validFrom: "2026-01-01", validUntil: "2026-12-31" },
  { id: "2", code: "FIRST50", description: "₹50 off on first order", discountType: "FIXED", discountValue: 50, maxDiscount: null, minimumOrder: 199, usageLimit: 500, usageCount: 89, isActive: true, validFrom: "2026-01-01", validUntil: "2026-06-30" },
  { id: "3", code: "WEEKEND30", description: "30% off on weekends", discountType: "PERCENTAGE", discountValue: 30, maxDiscount: 200, minimumOrder: 499, usageLimit: 200, usageCount: 200, isActive: false, validFrom: "2026-03-01", validUntil: "2026-04-30" },
];

export default function CouponsPage() {
  const { addToast } = useAdminStore();
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  const [editCoupon, setEditCoupon] = useState<EditCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/coupons");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCoupons(data.map((c: any) => ({
              ...c,
              discountValue: Number(c.discountValue),
              maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
              minimumOrder: Number(c.minimumOrder),
            })));
          }
        }
      } catch {}
    };
    fetchCoupons();
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await fetch(`/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...coupon, isActive: !coupon.isActive }),
      });
    } catch {}
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      addToast("Coupon deleted", "success");
    } catch {}
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    if (!editCoupon) return;
    setSaving(true);

    try {
      const url = editCoupon.isNew ? "/api/coupons" : `/api/coupons/${editCoupon.id}`;
      const res = await fetch(url, {
        method: editCoupon.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCoupon),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editCoupon.isNew) {
          setCoupons((prev) => [...prev, { ...saved, discountValue: Number(saved.discountValue), minimumOrder: Number(saved.minimumOrder) }]);
        } else {
          setCoupons((prev) => prev.map((c) => c.id === editCoupon.id ? { ...c, ...editCoupon } as Coupon : c));
        }
        addToast(editCoupon.isNew ? "Coupon created!" : "Coupon updated!", "success");
      } else {
        // Fallback local update
        if (editCoupon.isNew) {
          setCoupons((prev) => [...prev, {
            id: String(Date.now()), code: editCoupon.code || "", description: editCoupon.description || "",
            discountType: editCoupon.discountType || "PERCENTAGE", discountValue: editCoupon.discountValue || 0,
            maxDiscount: editCoupon.maxDiscount ?? null, minimumOrder: editCoupon.minimumOrder || 0,
            usageLimit: editCoupon.usageLimit || 0, usageCount: 0, isActive: true,
            validFrom: editCoupon.validFrom || "", validUntil: editCoupon.validUntil || "",
          }]);
        } else {
          setCoupons((prev) => prev.map((c) => c.id === editCoupon.id ? { ...c, ...(editCoupon as Coupon) } : c));
        }
      }
    } catch {
      addToast("Failed to save", "error");
    }

    setSaving(false);
    setEditCoupon(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Coupons</h1>
          <p className="text-warm-500 text-sm mt-1">Manage discount codes and promotions</p>
        </div>
        <motion.button
          onClick={() => setEditCoupon({
            isNew: true, code: "", description: "", discountType: "PERCENTAGE",
            discountValue: 10, minimumOrder: 199,
          })}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <motion.div key={coupon.id} layout
            className={`bg-white rounded-2xl border overflow-hidden ${coupon.isActive ? "border-warm-200/60" : "border-warm-200/40 opacity-70"}`}
            style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-warm-900 tracking-wider">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code, coupon.id)} className="p-1 rounded hover:bg-warm-100 cursor-pointer">
                        {copiedId === coupon.id ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-warm-400" />}
                      </button>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-500"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-warm-600 mb-3">{coupon.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <Percent className="w-4 h-4 text-primary" />
                <span className="font-semibold text-warm-800">
                  {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                </span>
                {coupon.maxDiscount && <span className="text-warm-500 text-xs">(max ₹{coupon.maxDiscount})</span>}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <span>Min order: ₹{coupon.minimumOrder}</span>
                  <span className="w-1 h-1 bg-warm-300 rounded-full" />
                  <span>Used: {coupon.usageCount}/{coupon.usageLimit || "∞"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-warm-500">
                  <Calendar className="w-3 h-3" />
                  {coupon.validFrom} to {coupon.validUntil}
                </div>
                {coupon.usageLimit > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${coupon.usageCount >= coupon.usageLimit ? "bg-red-400" : "bg-primary"}`}
                        style={{ width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t border-warm-100 flex items-center justify-between">
              <button onClick={() => toggleActive(coupon)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer ${coupon.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                {coupon.isActive ? "Deactivate" : "Activate"}
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditCoupon(coupon)} className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteCoupon(coupon.id)} className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editCoupon && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditCoupon(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
                  <h2 className="font-bold text-warm-900 text-lg">{editCoupon.isNew ? "Create Coupon" : "Edit Coupon"}</h2>
                  <button onClick={() => setEditCoupon(null)} className="p-2 rounded-lg hover:bg-warm-100 cursor-pointer"><X className="w-5 h-5 text-warm-500" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Code *</label>
                      <input type="text" value={editCoupon.code || ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase tracking-wider font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Type</label>
                      <select value={editCoupon.discountType || "PERCENTAGE"}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed Amount</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Description</label>
                    <input type="text" value={editCoupon.description || ""}
                      onChange={(e) => setEditCoupon((p) => p && { ...p, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">
                        {editCoupon.discountType === "PERCENTAGE" ? "% Value" : "₹ Value"}
                      </label>
                      <input type="number" value={editCoupon.discountValue || ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, discountValue: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Max ₹ Off</label>
                      <input type="number" value={editCoupon.maxDiscount ?? ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, maxDiscount: parseInt(e.target.value) || null })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Min Order ₹</label>
                      <input type="number" value={editCoupon.minimumOrder || ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, minimumOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Valid From</label>
                      <input type="date" value={editCoupon.validFrom || ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, validFrom: e.target.value })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Valid Until</label>
                      <input type="date" value={editCoupon.validUntil || ""}
                        onChange={(e) => setEditCoupon((p) => p && { ...p, validUntil: e.target.value })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3">
                  <button onClick={() => setEditCoupon(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-warm-600 hover:bg-warm-100 cursor-pointer">Cancel</button>
                  <motion.button onClick={handleSave} disabled={saving || !editCoupon.code}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#cc1530] cursor-pointer disabled:opacity-70"
                    whileTap={{ scale: 0.95 }}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
