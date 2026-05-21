"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus, Search, Edit2, Trash2, X, ChevronDown, Eye, EyeOff,
  Save, Loader2, LayoutGrid, List, Sparkles, RefreshCw, UploadCloud, Image as ImageIcon,
} from "lucide-react";
import VegBadge from "@/components/menu/VegBadge";
import { useAdminStore } from "@/store/admin";
import { getFallbackImage } from "@/lib/utils/menuHelper";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  isBestSeller: boolean;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  categoryId: string | null;
  totalOrders?: number;
}

interface Category {
  id: string;
  name: string;
}

type EditItem = Partial<MenuItem> & { isNew?: boolean };

function SafeMenuImage({ src, fallbackSrc, alt, fill, className }: { src: string; fallbackSrc: string; alt: string; fill?: boolean; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      className={className}
      style={fill ? { position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0, bottom: 0, objectFit: 'cover' } : undefined}
    />
  );
}

export default function MenuManagementPage() {
  const { addToast } = useAdminStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editItem, setEditItem] = useState<EditItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEditItem((prev) => prev && { ...prev, imageUrl: data.url });
        addToast("Image uploaded successfully!", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.error || "Failed to upload image", "error");
      }
    } catch {
      addToast("Failed to upload image", "error");
    }
    setUploadingImage(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch("/api/menu-items?admin=true&limit=2000", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);
        if (menuRes.ok) {
          const data = await menuRes.json();
          if (data && Array.isArray(data.items)) {
            setItems(data.items.map((i: any) => ({ 
              ...i, 
              price: Number(i.basePrice || i.price),
              isVeg: i.itemType === "VEG" || i.isVeg === true
            })));
          }
        }
        if (catRes.ok) {
          setCategories(await catRes.json());
        }
      } catch (error) {
        console.error("Failed to load admin menu items", error);
      }
    };
    fetchData();
  }, []);

  const catNames = ["All", ...Array.from(new Set(items.map((i) => i.category?.name || "Uncategorized")))];

  const filtered = items.filter((item) => {
    const catName = item.category?.name || "Uncategorized";
    const matchesCat = selectedCategory === "All" || catName === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleAvailability = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      await fetch(`/api/menu-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
    } catch {}
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i))
    );
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
      addToast("Item deleted", "success");
    } catch {}
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);

    try {
      const url = editItem.isNew ? "/api/menu-items" : `/api/menu-items/${editItem.id}`;
      const res = await fetch(url, {
        method: editItem.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItem.name,
          description: editItem.description,
          price: editItem.price,
          isVeg: editItem.isVeg,
          isBestSeller: editItem.isBestSeller,
          imageUrl: editItem.imageUrl,
          categoryId: editItem.categoryId,
          isAvailable: editItem.isAvailable ?? true,
        }),
      });

      if (res.ok) {
        addToast(editItem.isNew ? "Item created!" : "Item updated!", "success");
        // Refetch
        const menuRes = await fetch("/api/menu-items?admin=true&limit=2000", { cache: "no-store" });
        if (menuRes.ok) {
          const data = await menuRes.json();
          if (data && Array.isArray(data.items)) {
            setItems(data.items.map((i: any) => ({ 
              ...i, 
              price: Number(i.basePrice || i.price),
              isVeg: i.itemType === "VEG" || i.isVeg === true
            })));
          }
        }
      } else {
        // Fallback local update
        if (editItem.isNew) {
          const newItem: MenuItem = {
            id: String(Date.now()),
            name: editItem.name || "New Item",
            description: editItem.description || null,
            price: editItem.price || 0,
            isVeg: editItem.isVeg ?? true,
            isAvailable: true,
            isBestSeller: false,
            imageUrl: editItem.imageUrl || null,
            categoryId: editItem.categoryId || null,
            category: null,
          };
          setItems((prev) => [...prev, newItem]);
        } else {
          setItems((prev) =>
            prev.map((i) => (i.id === editItem.id ? { ...i, ...(editItem as MenuItem) } : i))
          );
        }
        addToast(editItem.isNew ? "Item added (local)" : "Item updated (local)", "info");
      }
    } catch {
      addToast("Failed to save", "error");
    }

    setSaving(false);
    setEditItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Menu Management</h1>
          <p className="text-warm-500 text-sm mt-1">
            {items.length} items • {items.filter((i) => i.isAvailable).length} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-warm-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-md cursor-pointer ${viewMode === "list" ? "bg-white shadow-sm text-warm-900" : "text-warm-400"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm text-warm-900" : "text-warm-400"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            onClick={() => {
              setAiImagePreview(null);
              setEditItem({
                isNew: true, name: "", description: "", price: 0, isVeg: true,
                imageUrl: "", categoryId: categories[0]?.id || "",
              });
            }}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex overflow-x-auto scrollbar-hide gap-1.5">
          {catNames.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat ? "bg-primary text-white" : "bg-warm-100 text-warm-600 hover:bg-warm-200"
              }`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input type="text" placeholder="Search items..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-warm-400" />
        </div>
      </div>

      {/* Items */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="hidden md:grid grid-cols-[auto_1fr_120px_100px_80px_100px] gap-4 px-5 py-3 bg-warm-50 text-xs font-semibold text-warm-500 uppercase tracking-wider border-b border-warm-200">
            <span className="w-14">Image</span><span>Name</span><span>Category</span><span>Price</span><span>Status</span><span>Actions</span>
          </div>
          <div className="divide-y divide-warm-100">
            {filtered.map((item) => (
              <div key={item.id}
                className={`px-5 py-3.5 flex items-center gap-4 hover:bg-warm-50 transition-colors ${!item.isAvailable ? "opacity-60" : ""}`}>
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0 relative">
                  <SafeMenuImage src={item.imageUrl || getFallbackImage(item.name, item.category?.name || "")} fallbackSrc={getFallbackImage(item.name, item.category?.name || "")} alt={item.name} fill className="object-cover" />
                  {!item.imageUrl && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-[9px] text-white font-extrabold uppercase tracking-wider">Auto</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <VegBadge isVeg={item.isVeg} size="sm" />
                    <span className="font-semibold text-warm-800 text-sm truncate">{item.name}</span>
                    {item.isBestSeller && (
                      <span className="text-xs text-accent-orange font-semibold hidden sm:inline">★ Best Seller</span>
                    )}
                  </div>
                  <span className="text-xs text-warm-500 md:hidden">{item.category?.name || "Uncategorized"}</span>
                </div>
                <span className="hidden md:block text-sm text-warm-600 w-[120px]">{item.category?.name || "—"}</span>
                <span className="font-semibold text-warm-800 text-sm w-[100px] hidden md:block">₹{item.price}</span>
                <div className="w-[80px] hidden md:block">
                  <button onClick={() => toggleAvailability(item.id)} className="cursor-pointer" title={item.isAvailable ? "Available" : "Unavailable"}>
                    {item.isAvailable ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-warm-400" />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => {
                    setAiImagePreview(null);
                    setEditItem(item);
                  }} className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-primary cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <motion.div key={item.id} className={`bg-white rounded-2xl border overflow-hidden ${!item.isAvailable ? "opacity-60" : "border-warm-200/60"}`}
              style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="relative aspect-square bg-warm-100">
                <SafeMenuImage src={item.imageUrl || getFallbackImage(item.name, item.category?.name || "")} fallbackSrc={getFallbackImage(item.name, item.category?.name || "")} alt={item.name} fill className="object-cover" />
                {!item.imageUrl && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-[10px] text-white font-extrabold uppercase tracking-wider">Auto Image</div>
                )}
                {item.isBestSeller && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-accent-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-lg">★ BEST</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <VegBadge isVeg={item.isVeg} size="sm" />
                  <h3 className="font-semibold text-warm-900 text-xs truncate">{item.name}</h3>
                </div>
                <p className="text-sm font-bold text-primary">₹{item.price}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-warm-100">
                  <span className="text-[10px] text-warm-500">{item.category?.name || "—"}</span>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setAiImagePreview(null);
                      setEditItem(item);
                    }} className="p-1 rounded hover:bg-warm-100 text-warm-400 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1 rounded hover:bg-red-50 text-warm-400 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditItem(null)} />
            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[60] bg-white flex flex-col">
              
              {/* Header */}
              <div className="px-6 md:px-12 py-5 border-b border-warm-200/50 flex items-center justify-between shrink-0 bg-white">
                <h2 className="font-bold text-warm-900 text-2xl">{editItem.isNew ? "Add New Item" : "Edit Item"}</h2>
                <button onClick={() => setEditItem(null)} className="p-2.5 rounded-full hover:bg-warm-100 text-warm-500 cursor-pointer transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto w-full bg-warm-50/30">
                <div className="max-w-7xl mx-auto p-6 md:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Image Settings */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white rounded-3xl p-6 md:p-8 border border-warm-200/60 shadow-sm space-y-6 sticky top-0">
                        <h3 className="text-lg font-bold text-warm-900 border-b border-warm-100 pb-4">Image Settings</h3>
                        
                        {/* Image Preview Container */}
                        <div className="flex items-center justify-center bg-warm-50 rounded-3xl border border-warm-200 p-4 min-h-[240px]">
                          {/* AI Preview */}
                          {aiImagePreview ? (
                            <div className="relative w-full rounded-2xl overflow-hidden border border-purple-200 bg-purple-50">
                              <div className="aspect-[4/3] relative">
                                <img src={aiImagePreview} alt="AI Generated" className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute top-3 left-3">
                                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Stock Photo
                                </span>
                              </div>
                              <div className="p-4 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditItem((prev) => prev && { ...prev, imageUrl: aiImagePreview });
                                    setAiImagePreview(null);
                                    addToast("AI image applied!", "success");
                                  }}
                                  className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 cursor-pointer transition-colors"
                                >
                                  ✅ Apply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAiImagePreview(null)}
                                  className="px-4 py-2.5 bg-warm-200 text-warm-700 text-sm font-medium rounded-xl hover:bg-warm-300 cursor-pointer transition-colors"
                                >
                                  Discard
                                </button>
                              </div>
                            </div>
                          ) : editItem.imageUrl ? (
                            <div className="relative w-full rounded-2xl overflow-hidden shadow-sm">
                              <div className="aspect-[4/3] relative">
                                <img src={editItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-warm-400">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50 text-warm-300" />
                              <p className="text-sm">No image selected</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            {/* AI Generate Button */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!editItem.name) {
                                  addToast("Enter an item name first", "error");
                                  return;
                                }
                                setGeneratingImage(true);
                                setAiImagePreview(null);
                                try {
                                  const res = await fetch("/api/admin/generate-image", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      itemName: editItem.name,
                                      description: editItem.description,
                                      isVeg: editItem.isVeg,
                                    }),
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    setAiImagePreview(data.imageUrl);
                                    addToast("Image found! Click 'Apply' to save.", "success");
                                  } else {
                                    const err = await res.json().catch(() => ({}));
                                    addToast(err.error || "Failed to generate image", "error");
                                  }
                                } catch {
                                  addToast("Error generating image", "error");
                                }
                                setGeneratingImage(false);
                              }}
                              disabled={generatingImage || !editItem.name}
                              className="flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl text-xs font-bold transition-all border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                            >
                              {generatingImage ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Finding...</>
                              ) : (
                                <><Sparkles className="w-4 h-4" /> Stock Photo</>
                              )}
                            </button>

                            {/* Device Upload Button */}
                            <label className={`flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${uploadingImage ? 'bg-warm-100 text-warm-400 border-warm-200 cursor-not-allowed' : 'bg-warm-50 hover:bg-warm-100 text-warm-700 border-warm-200'}`}>
                              {uploadingImage ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                              ) : (
                                <><UploadCloud className="w-4 h-4" /> Upload</>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider mb-2 block">Or paste image URL</label>
                            <input type="text" value={editItem.imageUrl || ""}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, imageUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full px-5 py-3.5 bg-warm-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Content */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Basic Info */}
                      <div className="bg-white rounded-3xl p-6 md:p-8 border border-warm-200/60 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-warm-900 border-b border-warm-100 pb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-warm-700 mb-2 block">Item Name *</label>
                            <input type="text" value={editItem.name || ""}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, name: e.target.value })}
                              placeholder="e.g. Margherita Pizza"
                              className="w-full px-5 py-3.5 bg-warm-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-warm-700 mb-2 block">Description</label>
                            <textarea value={editItem.description || ""} rows={4}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, description: e.target.value })}
                              placeholder="Briefly describe this item..."
                              className="w-full px-5 py-3.5 bg-warm-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200 resize-none" />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-warm-700 mb-2 block">Price (₹) *</label>
                            <input type="number" value={editItem.price || ""}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, price: parseInt(e.target.value) || 0 })}
                              className="w-full px-5 py-3.5 bg-warm-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200" />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-warm-700 mb-2 block">Category</label>
                            <div className="relative">
                              <select value={editItem.categoryId || ""}
                                onChange={(e) => setEditItem((prev) => prev && { ...prev, categoryId: e.target.value })}
                                className="w-full px-5 py-3.5 bg-warm-50 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200 appearance-none cursor-pointer">
                                <option value="">Select category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="bg-white rounded-3xl p-6 md:p-8 border border-warm-200/60 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-warm-900 border-b border-warm-100 pb-4">Attributes</h3>
                        <div className="flex flex-wrap gap-6">
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-warm-50 border border-warm-200 hover:border-warm-300 transition-colors">
                            <input type="checkbox" checked={editItem.isVeg ?? true}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, isVeg: e.target.checked })}
                              className="w-5 h-5 rounded accent-veg cursor-pointer" />
                            <span className="text-base font-semibold text-warm-800">Vegetarian</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-warm-50 border border-warm-200 hover:border-warm-300 transition-colors">
                            <input type="checkbox" checked={editItem.isBestSeller ?? false}
                              onChange={(e) => setEditItem((prev) => prev && { ...prev, isBestSeller: e.target.checked })}
                              className="w-5 h-5 rounded accent-accent-orange cursor-pointer" />
                            <span className="text-base font-semibold text-warm-800">Best Seller</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 md:px-12 py-5 border-t border-warm-200/50 flex items-center justify-end gap-4 shrink-0 bg-white">
                <button onClick={() => setEditItem(null)} className="px-6 py-3.5 rounded-2xl text-base font-bold text-warm-600 hover:bg-warm-100 cursor-pointer transition-colors">Cancel</button>
                <motion.button onClick={handleSave} disabled={saving || !editItem.name}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl text-base font-bold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70 shadow-lg shadow-primary/20"
                  whileTap={{ scale: saving ? 1 : 0.95 }}>
                  {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> {editItem.isNew ? "Create Item" : "Save Changes"}</>}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
