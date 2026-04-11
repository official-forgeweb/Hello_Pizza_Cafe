"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus, Edit2, Trash2, X, Save, Loader2, Eye, EyeOff,
  Image as ImageIcon, Sparkles, GripVertical,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface HeroSlide {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  tag: string;
  discount: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

type EditSlide = Partial<HeroSlide> & { isNew?: boolean };

const TAGS = ["NEW", "OFFER", "TRENDING", "HOT", "LIMITED"];

export default function HeroCMSPage() {
  const { addToast } = useAdminStore();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSlide, setEditSlide] = useState<EditSlide | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/hero-slides");
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch {
      addToast("Failed to load hero slides", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleSave = async () => {
    if (!editSlide) return;
    setSaving(true);

    try {
      const url = editSlide.isNew
        ? "/api/admin/hero-slides"
        : `/api/admin/hero-slides/${editSlide.id}`;

      const res = await fetch(url, {
        method: editSlide.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSlide),
      });

      if (res.ok) {
        addToast(editSlide.isNew ? "Slide created!" : "Slide updated!", "success");
        fetchSlides();
        setEditSlide(null);
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to save", "error");
      }
    } catch {
      addToast("Failed to save slide", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Slide deleted", "success");
        fetchSlides();
      }
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slide, isActive: !slide.isActive }),
      });
      fetchSlides();
    } catch {
      addToast("Failed to update", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-warm-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-warm-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Hero Section CMS</h1>
          <p className="text-warm-500 text-sm mt-1">
            Manage homepage hero ads and promotional banners
          </p>
        </div>
        <motion.button
          onClick={() => setEditSlide({
            isNew: true, title: "", description: "", imageUrl: "",
            tag: "NEW", discount: "", isActive: true,
          })}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </motion.button>
      </div>

      {/* Slides Grid */}
      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <ImageIcon className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="font-semibold text-warm-700">No hero slides yet</p>
          <p className="text-warm-500 text-sm mt-1">Add your first promotional slide</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slides.map((slide, i) => (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border overflow-hidden group ${
                slide.isActive ? "border-warm-200/60" : "border-warm-200/40 opacity-60"
              }`}
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Preview Image */}
              <div className="relative aspect-[16/9] bg-warm-100">
                {slide.imageUrl ? (
                  <Image src={slide.imageUrl} alt={slide.title} fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-warm-300" />
                  </div>
                )}
                {/* Tag Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {slide.tag}
                  </span>
                </div>
                {/* Order Badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-black/50 text-white text-[10px] font-bold w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    #{slide.displayOrder + 1}
                  </span>
                </div>
                {/* Discount overlay */}
                {slide.discount && (
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-accent-orange text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      {slide.discount}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-warm-900 text-sm line-clamp-1">{slide.title}</h3>
                {slide.description && (
                  <p className="text-xs text-warm-500 line-clamp-2 mt-1">{slide.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-warm-100 flex items-center justify-between">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    slide.isActive ? "text-green-600 hover:bg-green-50" : "text-warm-400 hover:bg-warm-100"
                  }`}
                >
                  {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {slide.isActive ? "Active" : "Inactive"}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditSlide(slide)}
                    className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editSlide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setEditSlide(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            >
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                  <h2 className="font-bold text-warm-900 text-lg">
                    {editSlide.isNew ? "Add Hero Slide" : "Edit Slide"}
                  </h2>
                  <button onClick={() => setEditSlide(null)} className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Preview */}
                  {editSlide.imageUrl && (
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-warm-100">
                      <Image src={editSlide.imageUrl} alt="Preview" fill sizes="400px" className="object-cover" />
                      {editSlide.tag && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                            {editSlide.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Title *</label>
                    <input
                      type="text"
                      value={editSlide.title || ""}
                      onChange={(e) => setEditSlide((p) => p && { ...p, title: e.target.value })}
                      placeholder="e.g. New Paneer Pizza Launch!"
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Description</label>
                    <textarea
                      value={editSlide.description || ""}
                      onChange={(e) => setEditSlide((p) => p && { ...p, description: e.target.value })}
                      placeholder="Short promo description..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Image URL *</label>
                    <input
                      type="text"
                      value={editSlide.imageUrl || ""}
                      onChange={(e) => setEditSlide((p) => p && { ...p, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Tag</label>
                      <select
                        value={editSlide.tag || "NEW"}
                        onChange={(e) => setEditSlide((p) => p && { ...p, tag: e.target.value })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-warm-200 cursor-pointer"
                      >
                        {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Discount</label>
                      <input
                        type="text"
                        value={editSlide.discount || ""}
                        onChange={(e) => setEditSlide((p) => p && { ...p, discount: e.target.value })}
                        placeholder="e.g. 20% OFF"
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Link URL</label>
                    <input
                      type="text"
                      value={editSlide.linkUrl || ""}
                      onChange={(e) => setEditSlide((p) => p && { ...p, linkUrl: e.target.value })}
                      placeholder="/menu?q=paneer"
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3">
                  <button onClick={() => setEditSlide(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-warm-600 hover:bg-warm-100 cursor-pointer">
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving || !editSlide.title || !editSlide.imageUrl}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70"
                    whileTap={{ scale: saving ? 1 : 0.95 }}
                  >
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
