"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Save, Loader2, Image as ImageIcon, Layout, Megaphone, UploadCloud, Sparkles, UtensilsCrossed } from "lucide-react";
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

interface SplashAd {
  id: string;
  title: string;
  subtitle: string | null;
  code: string | null;
  linkUrl: string | null;
  imageUrl: string;
  gradient: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdsManagementPage() {
  const { addToast } = useAdminStore();
  const [activeTab, setActiveTab] = useState<"hero" | "splash">("hero");
  
  // Data states
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [splashAds, setSplashAds] = useState<SplashAd[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editSlide, setEditSlide] = useState<Partial<HeroSlide> & { isNew?: boolean } | null>(null);
  const [editAd, setEditAd] = useState<Partial<SplashAd> & { isNew?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Search autocomplete states for menu quick-fill
  const [itemSearchText, setItemSearchText] = useState("");
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);

  useEffect(() => {
    setItemSearchText("");
    setItemDropdownOpen(false);
  }, [editSlide, editAd]);

  const handleFindStockPhoto = async (title: string, isHero: boolean) => {
    if (!title) {
      addToast("Enter a title first to find relevant photos", "error");
      return;
    }
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: title }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isHero) setEditSlide(p => p && { ...p, imageUrl: data.imageUrl });
        else setEditAd(p => p && { ...p, imageUrl: data.imageUrl });
        addToast("Found a matching photo!", "success");
      }
    } catch {
      addToast("Error finding photo", "error");
    }
    setGeneratingImage(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isHero: boolean) => {
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
        if (isHero) {
          setEditSlide((prev) => prev && { ...prev, imageUrl: data.url });
        } else {
          setEditAd((prev) => prev && { ...prev, imageUrl: data.url });
        }
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [heroRes, splashRes, menuRes] = await Promise.all([
        fetch("/api/admin/hero-slides"),
        fetch("/api/admin/splash-ads"),
        fetch("/api/menu-items?limit=1000&admin=true")
      ]);
      
      if (heroRes.ok) setHeroSlides(await heroRes.json());
      if (splashRes.ok) setSplashAds(await splashRes.json());
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData.items || []);
      }
    } catch (err) {
      addToast("Failed to fetch ads data", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSlide = async () => {
    if (!editSlide) return;
    setSaving(true);
    try {
      const url = editSlide.isNew ? "/api/admin/hero-slides" : `/api/admin/hero-slides/${editSlide.id}`;
      const res = await fetch(url, {
        method: editSlide.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSlide),
      });

      if (res.ok) {
        addToast(`Slide ${editSlide.isNew ? "created" : "updated"} successfully!`, "success");
        fetchData();
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

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hero slide?")) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Slide deleted", "success");
        fetchData();
      } else {
        addToast("Failed to delete", "error");
      }
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  const handleSaveAd = async () => {
    if (!editAd) return;
    setSaving(true);
    try {
      const url = editAd.isNew ? "/api/admin/splash-ads" : `/api/admin/splash-ads/${editAd.id}`;
      const res = await fetch(url, {
        method: editAd.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAd),
      });

      if (res.ok) {
        addToast(`Splash Ad ${editAd.isNew ? "created" : "updated"} successfully!`, "success");
        fetchData();
        setEditAd(null);
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to save", "error");
      }
    } catch {
      addToast("Failed to save ad", "error");
    }
    setSaving(false);
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this splash ad?")) return;
    try {
      const res = await fetch(`/api/admin/splash-ads/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Ad deleted", "success");
        fetchData();
      } else {
        addToast("Failed to delete", "error");
      }
    } catch {
      addToast("Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Promotions & Ads</h1>
          <p className="text-warm-500 text-sm mt-1">Manage hero banners and splash screen ads</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-warm-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "hero" ? "bg-white text-primary shadow-sm" : "text-warm-500 hover:text-warm-700 hover:bg-warm-200/50"
          }`}
        >
          <Layout className="w-4 h-4" />
          Hero Slides
        </button>
        <button
          onClick={() => setActiveTab("splash")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "splash" ? "bg-white text-primary shadow-sm" : "text-warm-500 hover:text-warm-700 hover:bg-warm-200/50"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Splash Ads
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-64 bg-warm-200 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : activeTab === "hero" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setEditSlide({ isNew: true, title: "", imageUrl: "", tag: "NEW", isActive: true, displayOrder: 0 })}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Hero Slide
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="bg-white border border-warm-200 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all">
                <div className="h-48 md:h-auto md:w-1/3 relative bg-warm-100 shrink-0">
                  <img src={slide.imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-warm-900">{slide.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${slide.isActive ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-500"}`}>
                        {slide.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {slide.description && <p className="text-sm text-warm-500 line-clamp-2 mb-2">{slide.description}</p>}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {slide.tag && <span className="text-xs bg-warm-100 text-warm-600 px-2 py-1 rounded-md font-medium">{slide.tag}</span>}
                      {slide.discount && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium">{slide.discount}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-warm-100 pt-3">
                    <span className="text-xs text-warm-400 font-medium">Order: {slide.displayOrder}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditSlide(slide)} className="p-2 text-warm-500 hover:text-primary hover:bg-warm-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSlide(slide.id)} className="p-2 text-warm-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {heroSlides.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-warm-200 rounded-2xl text-warm-500">
                No hero slides configured.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setEditAd({ isNew: true, title: "", imageUrl: "", gradient: "from-orange-600 to-red-600", isActive: true, displayOrder: 0 })}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Splash Ad
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {splashAds.map((ad) => (
              <div key={ad.id} className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-40 relative bg-warm-100">
                  <img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${ad.gradient} opacity-60 mix-blend-multiply`} />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="font-bold text-lg text-white">{ad.title}</h3>
                    {ad.subtitle && <p className="text-xs text-white/80 mt-1">{ad.subtitle}</p>}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    {ad.code && <span className="inline-block border border-dashed border-primary text-primary text-xs font-bold px-2 py-1 rounded bg-primary/5">{ad.code}</span>}
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.isActive ? "bg-green-100 text-green-700" : "bg-warm-100 text-warm-500"}`}>
                      {ad.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditAd(ad)} className="p-2 text-warm-500 hover:text-primary hover:bg-warm-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAd(ad.id)} className="p-2 text-warm-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {splashAds.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-warm-200 rounded-2xl text-warm-500">
                No splash ads configured.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Slide Edit Modal */}
      <AnimatePresence>
        {editSlide && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditSlide(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                  <h2 className="font-bold text-warm-900 text-lg">{editSlide.isNew ? "Add Hero Slide" : "Edit Hero Slide"}</h2>
                  <button onClick={() => setEditSlide(null)} className="p-2 rounded-lg hover:bg-warm-100"><X className="w-5 h-5 text-warm-500" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Quick-Fill Search Bar */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-purple-700 mb-1.5 block flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 w-fit">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quick-Fill from Menu Item
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search menu item (e.g. Pizza, Burger)..."
                        value={itemSearchText}
                        onChange={(e) => {
                          setItemSearchText(e.target.value);
                          setItemDropdownOpen(true);
                        }}
                        onFocus={() => setItemDropdownOpen(true)}
                        className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50"
                      />
                      {itemDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setItemDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-warm-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 divide-y divide-warm-100">
                            {menuItems
                              .filter((item: any) =>
                                item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
                                (item.category?.name && item.category.name.toLowerCase().includes(itemSearchText.toLowerCase()))
                              )
                              .slice(0, 8)
                              .map((item: any) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setEditSlide((p: any) => p && {
                                      ...p,
                                      title: item.name,
                                      description: item.description || p.description || "",
                                      imageUrl: item.imageUrl || p.imageUrl || "",
                                      linkUrl: `/menu?q=${encodeURIComponent(item.name)}`
                                    });
                                    setItemSearchText(item.name);
                                    setItemDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-warm-50 transition-colors flex items-center gap-3 cursor-pointer"
                                >
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                                      <UtensilsCrossed className="w-4 h-4 text-warm-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-warm-900 truncate">{item.name}</p>
                                    <p className="text-[10px] text-warm-400 truncate">{item.category?.name || "Uncategorized"}</p>
                                  </div>
                                  <span className="text-[10px] bg-warm-100 text-warm-600 px-2 py-0.5 rounded font-bold">₹{item.basePrice}</span>
                                </button>
                              ))}
                            {menuItems.filter((item: any) =>
                              item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
                              (item.category?.name && item.category.name.toLowerCase().includes(itemSearchText.toLowerCase()))
                            ).length === 0 && (
                              <div className="p-3 text-xs text-warm-500 text-center">No menu items found</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Title *</label>
                    <input type="text" value={editSlide.title || ""} onChange={(e) => setEditSlide(p => p && { ...p, title: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Description</label>
                    <textarea rows={2} value={editSlide.description || ""} onChange={(e) => setEditSlide(p => p && { ...p, description: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50 resize-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-warm-600 block">Image *</label>
                    
                    <div className="flex flex-col gap-3">
                      {/* Search & Upload Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleFindStockPhoto(editSlide.title || "", true)}
                          disabled={generatingImage || !editSlide.title}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                          {generatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Find Photo
                        </button>
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${uploadingImage ? 'bg-warm-100 text-warm-400 border-warm-200 cursor-not-allowed' : 'bg-warm-50 hover:bg-warm-100 text-warm-700 border-warm-200'}`}>
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          Upload Device
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={uploadingImage} />
                        </label>
                      </div>

                      {/* Manual URL Input */}
                      <div className="relative">
                        <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                        <input 
                          type="text" 
                          value={editSlide.imageUrl || ""} 
                          onChange={(e) => setEditSlide(p => p && { ...p, imageUrl: e.target.value })} 
                          className="w-full pl-10 pr-3 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                          placeholder="Or paste image URL here..." 
                        />
                      </div>
                    </div>

                    {editSlide.imageUrl && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-warm-200 bg-warm-50 h-48 relative shadow-inner group">
                        <img src={editSlide.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Tag (e.g. NEW)</label>
                      <input type="text" value={editSlide.tag || ""} onChange={(e) => setEditSlide(p => p && { ...p, tag: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Discount Text</label>
                      <input type="text" value={editSlide.discount || ""} onChange={(e) => setEditSlide(p => p && { ...p, discount: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Link / Redirect URL (Optional)</label>
                    <input type="text" value={editSlide.linkUrl || ""} onChange={(e) => setEditSlide(p => p && { ...p, linkUrl: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50" placeholder="/menu?category=123" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Display Order</label>
                      <input type="number" value={editSlide.displayOrder || 0} onChange={(e) => setEditSlide(p => p && { ...p, displayOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200" />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editSlide.isActive ?? true} onChange={(e) => setEditSlide(p => p && { ...p, isActive: e.target.checked })} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                        <span className="text-sm font-medium text-warm-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                  <button onClick={() => setEditSlide(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-warm-600 hover:bg-warm-100">Cancel</button>
                  <button onClick={handleSaveSlide} disabled={saving || !editSlide.title || !editSlide.imageUrl} className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#cc1530] disabled:opacity-70">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Splash Ad Edit Modal */}
      <AnimatePresence>
        {editAd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditAd(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                  <h2 className="font-bold text-warm-900 text-lg">{editAd.isNew ? "Add Splash Ad" : "Edit Splash Ad"}</h2>
                  <button onClick={() => setEditAd(null)} className="p-2 rounded-lg hover:bg-warm-100"><X className="w-5 h-5 text-warm-500" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Quick-Fill Search Bar */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-purple-700 mb-1.5 block flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 w-fit">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quick-Fill from Menu Item
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search menu item (e.g. Pizza, Burger)..."
                        value={itemSearchText}
                        onChange={(e) => {
                          setItemSearchText(e.target.value);
                          setItemDropdownOpen(true);
                        }}
                        onFocus={() => setItemDropdownOpen(true)}
                        className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50"
                      />
                      {itemDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setItemDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-warm-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 divide-y divide-warm-100">
                            {menuItems
                              .filter((item: any) =>
                                item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
                                (item.category?.name && item.category.name.toLowerCase().includes(itemSearchText.toLowerCase()))
                              )
                              .slice(0, 8)
                              .map((item: any) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setEditAd((p: any) => p && {
                                      ...p,
                                      title: item.name,
                                      subtitle: item.description || p.subtitle || "",
                                      imageUrl: item.imageUrl || p.imageUrl || "",
                                      linkUrl: `/menu?q=${encodeURIComponent(item.name)}`
                                    });
                                    setItemSearchText(item.name);
                                    setItemDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-warm-50 transition-colors flex items-center gap-3 cursor-pointer"
                                >
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                                      <UtensilsCrossed className="w-4 h-4 text-warm-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-warm-900 truncate">{item.name}</p>
                                    <p className="text-[10px] text-warm-400 truncate">{item.category?.name || "Uncategorized"}</p>
                                  </div>
                                  <span className="text-[10px] bg-warm-100 text-warm-600 px-2 py-0.5 rounded font-bold">₹{item.basePrice}</span>
                                </button>
                              ))}
                            {menuItems.filter((item: any) =>
                              item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
                              (item.category?.name && item.category.name.toLowerCase().includes(itemSearchText.toLowerCase()))
                            ).length === 0 && (
                              <div className="p-3 text-xs text-warm-500 text-center">No menu items found</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Title *</label>
                    <input type="text" value={editAd.title || ""} onChange={(e) => setEditAd(p => p && { ...p, title: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Subtitle</label>
                    <input type="text" value={editAd.subtitle || ""} onChange={(e) => setEditAd(p => p && { ...p, subtitle: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-warm-600 block">Image *</label>
                    
                    <div className="flex flex-col gap-3">
                      {/* Search & Upload Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleFindStockPhoto(editAd.title || "", false)}
                          disabled={generatingImage || !editAd.title}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                        >
                          {generatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Find Photo
                        </button>
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${uploadingImage ? 'bg-warm-100 text-warm-400 border-warm-200 cursor-not-allowed' : 'bg-warm-50 hover:bg-warm-100 text-warm-700 border-warm-200'}`}>
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          Upload Device
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} disabled={uploadingImage} />
                        </label>
                      </div>

                      {/* Manual URL Input */}
                      <div className="relative">
                        <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                        <input 
                          type="text" 
                          value={editAd.imageUrl || ""} 
                          onChange={(e) => setEditAd(p => p && { ...p, imageUrl: e.target.value })} 
                          className="w-full pl-10 pr-3 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                          placeholder="Or paste image URL here..." 
                        />
                      </div>
                    </div>

                    {editAd.imageUrl && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-warm-200 bg-warm-50 h-48 relative shadow-inner group">
                        <img src={editAd.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div className={`absolute inset-0 bg-gradient-to-t ${editAd.gradient || "from-orange-600 to-red-600"} opacity-40 mix-blend-multiply transition-opacity group-hover:opacity-60`} />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Coupon Code</label>
                      <input type="text" value={editAd.code || ""} onChange={(e) => setEditAd(p => p && { ...p, code: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 uppercase" placeholder="e.g. SAVE20" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Gradient Overlay</label>
                      <select value={editAd.gradient || "from-orange-600 to-red-600"} onChange={(e) => setEditAd(p => p && { ...p, gradient: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200">
                        <option value="from-orange-600 to-red-600">Orange to Red</option>
                        <option value="from-emerald-600 to-teal-600">Emerald to Teal</option>
                        <option value="from-blue-600 to-indigo-600">Blue to Indigo</option>
                        <option value="from-purple-600 to-fuchsia-600">Purple to Fuchsia</option>
                        <option value="from-black/80 to-black">Dark Overlay</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1 block">Link / Redirect URL (Optional)</label>
                    <input type="text" value={editAd.linkUrl || ""} onChange={(e) => setEditAd(p => p && { ...p, linkUrl: e.target.value })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200 focus:outline-none focus:border-primary/50" placeholder="/menu?category=123" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1 block">Display Order</label>
                      <input type="number" value={editAd.displayOrder || 0} onChange={(e) => setEditAd(p => p && { ...p, displayOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-warm-50 rounded-lg text-sm border border-warm-200" />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editAd.isActive ?? true} onChange={(e) => setEditAd(p => p && { ...p, isActive: e.target.checked })} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                        <span className="text-sm font-medium text-warm-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                  <button onClick={() => setEditAd(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-warm-600 hover:bg-warm-100">Cancel</button>
                  <button onClick={handleSaveAd} disabled={saving || !editAd.title || !editAd.imageUrl} className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#cc1530] disabled:opacity-70">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
