"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Save, Loader2, Layers,
  Eye, EyeOff, GripVertical,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  _count?: { menuItems: number };
}

type EditCategory = Partial<Category> & { isNew?: boolean };

export default function CategoriesPage() {
  const { addToast } = useAdminStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<EditCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      addToast("Failed to load categories", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!editCat) return;
    setSaving(true);
    try {
      const slug = (editCat.slug || editCat.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const url = editCat.isNew ? "/api/categories" : `/api/categories/${editCat.id}`;
      const res = await fetch(url, {
        method: editCat.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editCat, slug }),
      });
      if (res.ok) {
        addToast(editCat.isNew ? "Category created!" : "Category updated!", "success");
        fetchCategories();
        setEditCat(null);
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
    if (!confirm("Delete this category? Items in this category will become uncategorized.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Category deleted", "success");
        fetchCategories();
      } else {
        addToast("Cannot delete — has menu items", "error");
      }
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-warm-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-warm-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Categories</h1>
          <p className="text-warm-500 text-sm mt-1">{categories.length} categories</p>
        </div>
        <motion.button
          onClick={() => setEditCat({ isNew: true, name: "", description: "", isActive: true })}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </motion.button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <Layers className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="font-semibold text-warm-700">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border p-5 ${
                cat.isActive ? "border-warm-200/60" : "border-warm-200/40 opacity-60"
              }`}
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg">
                    {cat.icon || "🍕"}
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 text-sm">{cat.name}</h3>
                    <span className="text-[10px] text-warm-400 font-mono">/{cat.slug}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  cat.isActive ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-500"
                }`}>
                  {cat.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {cat.description && (
                <p className="text-xs text-warm-500 mt-3 line-clamp-2">{cat.description}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100">
                <span className="text-xs text-warm-500">
                  {cat._count?.menuItems ?? 0} items
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditCat(cat)}
                    className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-primary cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editCat && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditCat(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
                  <h2 className="font-bold text-warm-900 text-lg">{editCat.isNew ? "Add Category" : "Edit Category"}</h2>
                  <button onClick={() => setEditCat(null)} className="p-2 rounded-lg hover:bg-warm-100 cursor-pointer"><X className="w-5 h-5 text-warm-500" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Name *</label>
                    <input type="text" value={editCat.name || ""}
                      onChange={(e) => setEditCat((p) => p && { ...p, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Description</label>
                    <textarea value={editCat.description || ""} rows={2}
                      onChange={(e) => setEditCat((p) => p && { ...p, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Icon (emoji)</label>
                      <input type="text" value={editCat.icon || ""}
                        onChange={(e) => setEditCat((p) => p && { ...p, icon: e.target.value })} maxLength={4}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-center text-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Display Order</label>
                      <input type="number" value={editCat.displayOrder ?? 0}
                        onChange={(e) => setEditCat((p) => p && { ...p, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3">
                  <button onClick={() => setEditCat(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-warm-600 hover:bg-warm-100 cursor-pointer">Cancel</button>
                  <motion.button onClick={handleSave} disabled={saving || !editCat.name}
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
