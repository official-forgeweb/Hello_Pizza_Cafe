"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Save, Loader2, Puzzle,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";
import VegBadge from "@/components/menu/VegBadge";

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  addonGroup: string;
  itemType: "VEG" | "NON_VEG";
  isAvailable: boolean;
  displayOrder: number;
}

type EditAddOn = Partial<AddOn> & { isNew?: boolean };

const ADDON_GROUPS = ["Extra Cheese", "Toppings", "Sauces", "Sides", "Drinks", "Other"];

export default function AddOnsPage() {
  const { addToast } = useAdminStore();
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAddon, setEditAddon] = useState<EditAddOn | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("All");

  const fetchAddons = async () => {
    try {
      const res = await fetch("/api/admin/addons");
      if (res.ok) setAddons(await res.json());
    } catch {
      // Use empty state
    }
    setLoading(false);
  };

  useEffect(() => { fetchAddons(); }, []);

  const groups = ["All", ...Array.from(new Set(addons.map((a) => a.addonGroup)))];
  const filtered = activeGroup === "All" ? addons : addons.filter((a) => a.addonGroup === activeGroup);

  const handleSave = async () => {
    if (!editAddon) return;
    setSaving(true);
    try {
      const url = editAddon.isNew ? "/api/admin/addons" : `/api/admin/addons/${editAddon.id}`;
      const res = await fetch(url, {
        method: editAddon.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAddon),
      });
      if (res.ok) {
        addToast(editAddon.isNew ? "Add-on created!" : "Add-on updated!", "success");
        fetchAddons();
        setEditAddon(null);
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to save", "error");
      }
    } catch {
      addToast("Failed to save", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this add-on?")) return;
    try {
      await fetch(`/api/admin/addons/${id}`, { method: "DELETE" });
      addToast("Add-on deleted", "success");
      fetchAddons();
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-warm-200 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-warm-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Add-ons</h1>
          <p className="text-warm-500 text-sm mt-1">{addons.length} add-ons across {groups.length - 1} groups</p>
        </div>
        <motion.button
          onClick={() => setEditAddon({ isNew: true, name: "", price: 0, addonGroup: "Toppings", itemType: "VEG", isAvailable: true })}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Add-on
        </motion.button>
      </div>

      {/* Group Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide gap-1.5">
        {groups.map((g) => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeGroup === g ? "bg-primary text-white" : "bg-warm-100 text-warm-600 hover:bg-warm-200"
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Add-ons List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <Puzzle className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="font-semibold text-warm-700">No add-ons found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="divide-y divide-warm-100">
            {filtered.map((addon, i) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`px-5 py-3.5 flex items-center gap-4 hover:bg-warm-50 transition-colors ${
                  !addon.isAvailable ? "opacity-50" : ""
                }`}
              >
                <VegBadge isVeg={addon.itemType === "VEG"} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-warm-800 text-sm">{addon.name}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">
                      {addon.addonGroup}
                    </span>
                  </div>
                  {addon.description && <p className="text-xs text-warm-500 mt-0.5">{addon.description}</p>}
                </div>
                <span className="font-bold text-warm-900 text-sm">+₹{Number(addon.price)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditAddon(addon)}
                    className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-primary cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addon.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editAddon && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditAddon(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
                  <h2 className="font-bold text-warm-900 text-lg">{editAddon.isNew ? "Add Add-on" : "Edit Add-on"}</h2>
                  <button onClick={() => setEditAddon(null)} className="p-2 rounded-lg hover:bg-warm-100 cursor-pointer"><X className="w-5 h-5 text-warm-500" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Name *</label>
                    <input type="text" value={editAddon.name || ""}
                      onChange={(e) => setEditAddon((p) => p && { ...p, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Price (₹) *</label>
                      <input type="number" value={editAddon.price ?? ""}
                        onChange={(e) => setEditAddon((p) => p && { ...p, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Group</label>
                      <select value={editAddon.addonGroup || "Toppings"}
                        onChange={(e) => setEditAddon((p) => p && { ...p, addonGroup: e.target.value })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
                        {ADDON_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Description</label>
                    <input type="text" value={editAddon.description || ""}
                      onChange={(e) => setEditAddon((p) => p && { ...p, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editAddon.itemType === "VEG"} onChange={(e) =>
                        setEditAddon((p) => p && { ...p, itemType: e.target.checked ? "VEG" : "NON_VEG" })}
                        className="w-4 h-4 accent-veg rounded cursor-pointer" />
                      <span className="text-sm text-warm-700">Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editAddon.isAvailable ?? true} onChange={(e) =>
                        setEditAddon((p) => p && { ...p, isAvailable: e.target.checked })}
                        className="w-4 h-4 accent-primary rounded cursor-pointer" />
                      <span className="text-sm text-warm-700">Available</span>
                    </label>
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3">
                  <button onClick={() => setEditAddon(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-warm-600 hover:bg-warm-100 cursor-pointer">Cancel</button>
                  <motion.button onClick={handleSave} disabled={saving || !editAddon.name}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#cc1530] cursor-pointer disabled:opacity-70" whileTap={{ scale: 0.95 }}>
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
