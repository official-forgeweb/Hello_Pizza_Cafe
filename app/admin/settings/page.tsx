
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Cloud,
  MailQuestion,
  Tag,
  Monitor,
  Database,
  Trash2,
  Plus,
  Edit2,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "website" | "pos-settings" | "smtp" | "discounts" | "devices" | "backups"
  >("website");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tab 1: Mock Website Settings
  const [websiteSettings, setWebsiteSettings] = useState({
    restaurantName: "Hello Pizza",
    phone: "085860 76383",
    email: "hello@hellopizza.in",
    address: "Main Market, Ballabhgarh, Faridabad, Haryana 121004",
    website: "https://hello-pizza-cafe.vercel.app",
    openingTime: "11:00",
    closingTime: "23:00",
    deliveryRadius: "10",
    minOrderAmount: "99",
    freeDeliveryMin: "499",
    deliveryFee: "30",
    taxRate: "5",
    estimatedPrepTime: "20",
    estimatedDeliveryTime: "40",
  });

  // Tab 2: POS Cloud Settings
  const [posSettings, setPosSettings] = useState({
    cafeName: "",
    taxPercent: 5.0,
    currency: "INR",
    loyaltyPointsPerAmount: 5,
    loyaltyAmountThreshold: 100,
    loyaltyMinHours: 24,
    loyaltyMaxDays: 30,
  });

  // Tab 3: SMTP Settings
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    salesReportRecipients: [] as string[],
    hourlyReportEnabled: true,
  });
  const [newRecipient, setNewRecipient] = useState("");

  // Tab 4: Discounts Settings
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Tab 5: Devices
  const [devices, setDevices] = useState<any[]>([]);

  // Tab 6: Backups
  const [backups, setBackups] = useState<any[]>([]);

  // Load Initial Data
  useEffect(() => {
    fetchPosSettings();
    fetchSmtpSettings();
    fetchDiscounts();
    fetchMenuItems();
    fetchDevices();
    fetchBackups();
  }, []);

  // API Fetches
  const fetchPosSettings = async () => {
    try {
      const res = await fetch("/api/admin/global-settings");
      if (res.ok) {
        const data = await res.json();
        setPosSettings({
          cafeName: data.cafeName,
          taxPercent: Number(data.taxPercent),
          currency: data.currency,
          loyaltyPointsPerAmount: Number(data.loyaltyPointsPerAmount),
          loyaltyAmountThreshold: Number(data.loyaltyAmountThreshold),
          loyaltyMinHours: Number(data.loyaltyMinHours),
          loyaltyMaxDays: Number(data.loyaltyMaxDays),
        });
      }
    } catch (e) {
      console.error("Failed to fetch POS settings:", e);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch("/api/admin/email-config");
      if (res.ok) {
        const data = await res.json();
        setSmtpSettings({
          smtpHost: data.smtpHost || "",
          smtpPort: Number(data.smtpPort ?? 587),
          smtpUser: data.smtpUser || "",
          smtpPass: data.smtpPass || "",
          salesReportRecipients: data.salesReportRecipients || [],
          hourlyReportEnabled: data.hourlyReportEnabled ?? true,
        });
      }
    } catch (e) {
      console.error("Failed to fetch SMTP settings:", e);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts");
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      }
    } catch (e) {
      console.error("Failed to fetch discounts:", e);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu-items?admin=true&limit=200");
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch menu items:", e);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/admin/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error("Failed to fetch devices:", e);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {
      console.error("Failed to fetch backups:", e);
    }
  };

  // Save Handlers
  const handleSaveWebsiteSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulating mock save
    setSaving(false);
    alert("Website configurations saved successfully (Mock)!");
  };

  const handleSavePosSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/global-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posSettings),
      });
      if (res.ok) {
        alert("Global POS settings saved successfully! POS devices will sync within seconds.");
      } else {
        alert("Failed to save POS settings.");
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtpSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      });
      if (res.ok) {
        alert("SMTP configuration successfully synced to cloud.");
      } else {
        alert("Failed to save SMTP settings.");
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscount.name || !editingDiscount.type || editingDiscount.value === undefined) {
      alert("Please fill all required fields.");
      return;
    }

    const isNew = !editingDiscount.id;
    const url = isNew ? "/api/admin/discounts" : `/api/admin/discounts/${editingDiscount.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDiscount),
      });

      if (res.ok) {
        setIsDiscountModalOpen(false);
        fetchDiscounts();
        alert(`Discount rule ${isNew ? "created" : "updated"} successfully!`);
      } else {
        alert("Failed to save discount rule.");
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount rule?")) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDiscounts();
        alert("Discount rule deleted.");
      }
    } catch (e) {
      alert("Delete failed.");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Are you sure you want to unregister this POS device? It will re-register on next startup if it's online.")) return;
    try {
      const res = await fetch(`/api/admin/devices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDevices();
        alert("Device removed successfully.");
      }
    } catch (e) {
      alert("Failed to delete device.");
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backup from the cloud? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/backups?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBackups();
        alert("Backup deleted.");
      }
    } catch (e) {
      alert("Failed to delete backup.");
    }
  };

  const isDeviceOnline = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 10 * 60 * 1000; // Online if seen in last 10 minutes
  };

  const formatBytes = (bytes: string) => {
    const b = parseInt(bytes);
    if (isNaN(b) || b === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Settings Navigation Sidebar */}
      <div className="w-full lg:w-[260px] bg-white border border-warm-200/60 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 shrink-0">
        {[
          { id: "website", label: "Website Settings", icon: MapPin },
          { id: "pos-settings", label: "Cloud POS Settings", icon: Cloud },
          { id: "smtp", label: "SMTP Email Settings", icon: MailQuestion },
          { id: "discounts", label: "Discount Rules", icon: Tag },
          { id: "devices", label: "Device Monitor", icon: Monitor },
          { id: "backups", label: "Database Backups", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md shadow-primary/15"
                : "text-warm-600 hover:bg-warm-50 hover:text-warm-900"
            }`}
          >
            <tab.icon className="w-4.5 h-4.5 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 w-full bg-white border border-warm-200/60 rounded-2xl p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* TAB 1: Website Settings */}
          {activeTab === "website" && (
            <motion.div
              key="website"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-warm-900">Website & Delivery</h2>
                <p className="text-warm-500 text-sm mt-1">Configure user-facing online storefront rules</p>
              </div>

              <div className="space-y-6">
                <div className="bg-warm-50/50 p-5 rounded-2xl border border-warm-100 space-y-4">
                  <h3 className="font-bold text-sm text-warm-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Store details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Store Name"
                      value={websiteSettings.restaurantName}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, restaurantName: v })}
                    />
                    <Field
                      label="Website URL"
                      value={websiteSettings.website}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, website: v })}
                    />
                    <Field
                      label="Store Phone"
                      value={websiteSettings.phone}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, phone: v })}
                    />
                    <Field
                      label="Store Email"
                      value={websiteSettings.email}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, email: v })}
                    />
                  </div>
                  <Field
                    label="Address"
                    value={websiteSettings.address}
                    onChange={(v) => setWebsiteSettings({ ...websiteSettings, address: v })}
                  />
                </div>

                <div className="bg-warm-50/50 p-5 rounded-2xl border border-warm-100 space-y-4">
                  <h3 className="font-bold text-sm text-warm-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Timings & Delivery Thresholds
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Opening Time"
                      value={websiteSettings.openingTime}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, openingTime: v })}
                      type="time"
                    />
                    <Field
                      label="Closing Time"
                      value={websiteSettings.closingTime}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, closingTime: v })}
                      type="time"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Delivery Radius (km)"
                      value={websiteSettings.deliveryRadius}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, deliveryRadius: v })}
                      type="number"
                    />
                    <Field
                      label="Min Order Amount (₹)"
                      value={websiteSettings.minOrderAmount}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, minOrderAmount: v })}
                      type="number"
                    />
                    <Field
                      label="Free Delivery Threshold (₹)"
                      value={websiteSettings.freeDeliveryMin}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, freeDeliveryMin: v })}
                      type="number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Delivery Fee (₹)"
                      value={websiteSettings.deliveryFee}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, deliveryFee: v })}
                      type="number"
                    />
                    <Field
                      label="Average Prep Time (min)"
                      value={websiteSettings.estimatedPrepTime}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, estimatedPrepTime: v })}
                      type="number"
                    />
                    <Field
                      label="Average Delivery Time (min)"
                      value={websiteSettings.estimatedDeliveryTime}
                      onChange={(v) => setWebsiteSettings({ ...websiteSettings, estimatedDeliveryTime: v })}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveWebsiteSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Website Config</>
                )}
              </button>
            </motion.div>
          )}

          {/* TAB 2: Cloud POS Settings */}
          {activeTab === "pos-settings" && (
            <motion.div
              key="pos-settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-warm-900">Cloud POS Configuration</h2>
                <p className="text-warm-500 text-sm mt-1">Configure global store settings pushed to all billing terminals</p>
              </div>

              <div className="space-y-6">
                <div className="bg-sky-50/40 p-5 rounded-2xl border border-sky-100/50 space-y-4">
                  <h3 className="font-bold text-sm text-sky-800 flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Global Settings (Cloud Source of Truth)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Field
                        label="POS Cafe Name"
                        value={posSettings.cafeName}
                        onChange={(v) => setPosSettings({ ...posSettings, cafeName: v })}
                        placeholder="e.g. Hello Pizza Cafe"
                      />
                    </div>
                    <Field
                      label="Local Currency Symbol"
                      value={posSettings.currency}
                      onChange={(v) => setPosSettings({ ...posSettings, currency: v })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Store Tax Rate (%)"
                      value={posSettings.taxPercent.toString()}
                      onChange={(v) => setPosSettings({ ...posSettings, taxPercent: parseFloat(v) || 0 })}
                      type="number"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/40 space-y-4">
                  <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                    🏆 Loyalty Points rules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Points earned per threshold block"
                      value={posSettings.loyaltyPointsPerAmount.toString()}
                      onChange={(v) => setPosSettings({ ...posSettings, loyaltyPointsPerAmount: parseInt(v) || 0 })}
                      type="number"
                    />
                    <Field
                      label="Spent threshold block size (₹)"
                      value={posSettings.loyaltyAmountThreshold.toString()}
                      onChange={(v) => setPosSettings({ ...posSettings, loyaltyAmountThreshold: parseFloat(v) || 0 })}
                      type="number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Points Lock-in Period (hours)"
                      value={posSettings.loyaltyMinHours.toString()}
                      onChange={(v) => setPosSettings({ ...posSettings, loyaltyMinHours: parseFloat(v) || 0 })}
                      type="number"
                    />
                    <Field
                      label="Points validity lifespan (days)"
                      value={posSettings.loyaltyMaxDays.toString()}
                      onChange={(v) => setPosSettings({ ...posSettings, loyaltyMaxDays: parseFloat(v) || 0 })}
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePosSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Cloud POS Settings</>
                )}
              </button>
            </motion.div>
          )}

          {/* TAB 3: SMTP Settings */}
          {activeTab === "smtp" && (
            <motion.div
              key="smtp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-warm-900">SMTP Email Server</h2>
                <p className="text-warm-500 text-sm mt-1">Configure Nodemailer credentials for daily sales report dispatches</p>
              </div>

              <div className="space-y-6">
                <div className="bg-warm-50/50 p-5 rounded-2xl border border-warm-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Field
                        label="SMTP Server Host"
                        value={smtpSettings.smtpHost}
                        onChange={(v) => setSmtpSettings({ ...smtpSettings, smtpHost: v })}
                        placeholder="e.g. smtp.gmail.com"
                      />
                    </div>
                    <Field
                      label="SMTP Port"
                      value={smtpSettings.smtpPort.toString()}
                      onChange={(v) => setSmtpSettings({ ...smtpSettings, smtpPort: parseInt(v) || 587 })}
                      type="number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="SMTP Auth Username (Email)"
                      value={smtpSettings.smtpUser}
                      onChange={(v) => setSmtpSettings({ ...smtpSettings, smtpUser: v })}
                      placeholder="e.g. your-email@gmail.com"
                    />
                    <Field
                      label="SMTP App Password"
                      value={smtpSettings.smtpPass}
                      onChange={(v) => setSmtpSettings({ ...smtpSettings, smtpPass: v })}
                      type="password"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>

                <div className="bg-warm-50/50 p-5 rounded-2xl border border-warm-100 space-y-4">
                  <h3 className="font-bold text-sm text-warm-700">Sales Report Recipients</h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-2 bg-white rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newRecipient.trim() && !smtpSettings.salesReportRecipients.includes(newRecipient.trim())) {
                          setSmtpSettings({
                            ...smtpSettings,
                            salesReportRecipients: [...smtpSettings.salesReportRecipients, newRecipient.trim()],
                          });
                          setNewRecipient("");
                        }
                      }}
                      className="px-4 py-2 bg-warm-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {smtpSettings.salesReportRecipients.length === 0 ? (
                      <span className="text-xs text-warm-400 italic">No recipients registered. SMTP server will default to sender address.</span>
                    ) : (
                      smtpSettings.salesReportRecipients.map((email, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-warm-100 text-warm-800 rounded-full text-xs font-medium border border-warm-200">
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSmtpSettings({
                                ...smtpSettings,
                                salesReportRecipients: smtpSettings.salesReportRecipients.filter((_, idx) => idx !== i),
                              });
                            }}
                            className="text-warm-500 hover:text-red-600 font-bold shrink-0 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-warm-100">
                    <input
                      type="checkbox"
                      id="hourlyReport"
                      checked={smtpSettings.hourlyReportEnabled}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, hourlyReportEnabled: e.target.checked })}
                      className="w-4.5 h-4.5 accent-primary cursor-pointer"
                    />
                    <label htmlFor="hourlyReport" className="text-sm font-semibold text-warm-700 cursor-pointer">
                      Enable automated End-of-Day/Hourly sales reports sending to recipients
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSmtpSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save SMTP Config</>
                )}
              </button>
            </motion.div>
          )}

          {/* TAB 4: Discount Rules */}
          {activeTab === "discounts" && (
            <motion.div
              key="discounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-warm-900">Cloud Discount Rules</h2>
                  <p className="text-warm-500 text-sm mt-1">Manage promotion engine campaigns synced to POS devices</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDiscount({
                      name: "",
                      type: "percentage",
                      value: 0,
                      minOrderAmount: 0,
                      applicableItems: [],
                      isActive: true,
                      validFrom: "",
                      validUntil: "",
                      applicableDays: [],
                      startTime: "",
                      endTime: "",
                    });
                    setIsDiscountModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Rule
                </button>
              </div>
 
              <div className="border border-warm-200/60 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-50 text-warm-700 text-xs font-bold border-b border-warm-200">
                      <th className="px-5 py-4">Rule Name</th>
                      <th className="px-5 py-4">Discount</th>
                      <th className="px-5 py-4">Min. Order</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Validity</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 text-sm text-warm-600">
                    {discounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-warm-400 italic bg-white">
                          No promotion/discount rules configured yet.
                        </td>
                      </tr>
                    ) : (
                      discounts.map((rule) => (
                        <tr key={rule.id} className="hover:bg-warm-50/30 transition-colors bg-white">
                          <td className="px-5 py-4 font-semibold text-warm-900">{rule.name}</td>
                          <td className="px-5 py-4 font-bold text-emerald-600">
                            {rule.type === "percentage" ? `${rule.value}%` : `₹${rule.value}`}
                          </td>
                          <td className="px-5 py-4">₹{Number(rule.minOrderAmount || 0)}</td>
                          <td className="px-5 py-4">
                            {rule.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warm-100 text-warm-500 border border-warm-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-warm-400" /> Paused
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <div className="flex flex-col gap-1">
                              {rule.validFrom || rule.validUntil ? (
                                <div className="text-[11px]">
                                  {rule.validFrom && <span>From: {new Date(rule.validFrom).toLocaleDateString()}</span>}
                                  {rule.validUntil && <span> Until: {new Date(rule.validUntil).toLocaleDateString()}</span>}
                                </div>
                              ) : (
                                <span className="text-warm-400">Always valid</span>
                              )}
                              
                              {(rule.startTime || rule.endTime) && (
                                <div className="text-primary font-semibold text-[11px]">
                                  Time: {rule.startTime || "00:00"} - {rule.endTime || "23:59"}
                                </div>
                              )}
                              {rule.applicableDays && rule.applicableDays.length > 0 && (
                                <div className="text-warm-500 font-medium text-[11px]">
                                  Days: {rule.applicableDays.map((d: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingDiscount({
                                    ...rule,
                                    validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().slice(0, 16) : "",
                                    validUntil: rule.validUntil ? new Date(rule.validUntil).toISOString().slice(0, 16) : "",
                                    applicableDays: rule.applicableDays || [],
                                    startTime: rule.startTime || "",
                                    endTime: rule.endTime || "",
                                  });
                                  setIsDiscountModalOpen(true);
                                }}
                                className="p-1.5 text-warm-500 hover:text-primary rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDiscount(rule.id)}
                                className="p-1.5 text-warm-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: Device Monitor */}
          {activeTab === "devices" && (
            <motion.div
              key="devices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-warm-900">Device Registry & Heartbeats</h2>
                <p className="text-warm-500 text-sm mt-1">Real-time status board of active POS registers and billing terminals</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.length === 0 ? (
                  <div className="md:col-span-2 border border-warm-200/60 rounded-2xl p-8 text-center text-warm-400 italic">
                    No billing devices registered yet. Turn on a POS terminal configured with this project URL.
                  </div>
                ) : (
                  devices.map((device) => {
                    const online = isDeviceOnline(device.lastSeenAt);
                    return (
                      <div
                        key={device.id}
                        className={`border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between gap-4 transition-all ${
                          online ? "border-emerald-150 shadow-emerald-50/10" : "border-warm-200/60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${online ? "bg-emerald-50 text-emerald-600" : "bg-warm-100 text-warm-500"}`}>
                              <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-warm-900">{device.deviceName || "POS Register"}</h4>
                              <p className="text-xs text-warm-400 font-mono mt-0.5">ID: {device.id}</p>
                            </div>
                          </div>
                          
                          {online ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                              Online
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warm-100 text-warm-500 border border-warm-200">
                              Offline
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-warm-100 pt-4 text-xs text-warm-500">
                          <div>
                            <span className="block text-warm-400 font-medium">Local Network IP</span>
                            <span className="font-semibold text-warm-700 mt-0.5 block">{device.deviceIp || "Unknown"}</span>
                          </div>
                          <div>
                            <span className="block text-warm-400 font-medium">Last Ping / Heartbeat</span>
                            <span className="font-semibold text-warm-700 mt-0.5 block">
                              {new Date(device.lastSeenAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Register
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: Backups */}
          {activeTab === "backups" && (
            <motion.div
              key="backups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-warm-900">Database Backup Archives</h2>
                <p className="text-warm-500 text-sm mt-1">Download and manage SQLite binary dumps uploaded by your POS terminals</p>
              </div>

              <div className="border border-warm-200/60 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-50 text-warm-700 text-xs font-bold border-b border-warm-200">
                      <th className="px-5 py-4">Backup File Name</th>
                      <th className="px-5 py-4">File Size</th>
                      <th className="px-5 py-4">Source Device</th>
                      <th className="px-5 py-4">Upload Date</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 text-sm text-warm-600">
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-warm-400 italic bg-white">
                          No database backups stored in Supabase storage bucket.
                        </td>
                      </tr>
                    ) : (
                      backups.map((bk) => (
                        <tr key={bk.id} className="hover:bg-warm-50/30 transition-colors bg-white">
                          <td className="px-5 py-4 font-medium text-warm-900 font-mono text-xs">{bk.fileName}</td>
                          <td className="px-5 py-4">{formatBytes(bk.fileSize)}</td>
                          <td className="px-5 py-4">{bk.device?.deviceName || "POS Register"}</td>
                          <td className="px-5 py-4">{new Date(bk.createdAt).toLocaleString()}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/api/admin/backups?id=${bk.id}&action=download`}
                                download
                                className="p-1.5 text-warm-500 hover:text-primary rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                                title="Download Backup File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteBackup(bk.id)}
                                className="p-1.5 text-warm-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Backup"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DISCOUNTS EDIT MODAL */}
      <AnimatePresence>
        {isDiscountModalOpen && editingDiscount && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-warm-200 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-warm-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-warm-900">
                  {editingDiscount.id ? "Edit Discount Rule" : "Create New Discount Rule"}
                </h3>
                <button
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-warm-100 text-warm-500 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDiscount} className="p-6 space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Rule Name (POS display)"
                    value={editingDiscount.name}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, name: v })}
                    placeholder="e.g. 10% Flat Pizza Sale"
                    required
                  />
                  <div>
                    <label className="text-xs font-semibold text-warm-600 mb-1.5 block">Discount Type</label>
                    <select
                      value={editingDiscount.type}
                      onChange={(e) => setEditingDiscount({ ...editingDiscount, type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Discount Value"
                    value={editingDiscount.value?.toString() || "0"}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, value: parseFloat(v) || 0 })}
                    type="number"
                    required
                  />
                  <Field
                    label="Min Order Amount (₹)"
                    value={editingDiscount.minOrderAmount?.toString() || "0"}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, minOrderAmount: parseFloat(v) || 0 })}
                    type="number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Valid From"
                    value={editingDiscount.validFrom || ""}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, validFrom: v })}
                    type="datetime-local"
                  />
                  <Field
                    label="Valid Until"
                    value={editingDiscount.validUntil || ""}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, validUntil: v })}
                    type="datetime-local"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Start Time (e.g., 14:00)"
                    value={editingDiscount.startTime || ""}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, startTime: v })}
                    type="time"
                  />
                  <Field
                    label="End Time (e.g., 17:00)"
                    value={editingDiscount.endTime || ""}
                    onChange={(v) => setEditingDiscount({ ...editingDiscount, endTime: v })}
                    type="time"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-warm-600 mb-1.5 block">
                    Applicable Days (Select none to apply all days)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 0, label: "Sun" },
                      { val: 1, label: "Mon" },
                      { val: 2, label: "Tue" },
                      { val: 3, label: "Wed" },
                      { val: 4, label: "Thu" },
                      { val: 5, label: "Fri" },
                      { val: 6, label: "Sat" }
                    ].map((d) => {
                      const isSelected = editingDiscount.applicableDays?.includes(d.val);
                      return (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => {
                            const current = editingDiscount.applicableDays || [];
                            const updated = isSelected
                              ? current.filter((v: number) => v !== d.val)
                              : [...current, d.val];
                            setEditingDiscount({ ...editingDiscount, applicableDays: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-warm-50 text-warm-600 border-warm-200 hover:bg-warm-100"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Applicable Items Selection */}
                <div>
                  <label className="text-xs font-semibold text-warm-600 mb-1.5 block">
                    Applicable Menu Items (Select none to apply store-wide)
                  </label>
                  <div className="border border-warm-200 rounded-xl max-h-48 overflow-y-auto p-3 bg-warm-50/50 space-y-2">
                    {menuItems.map((item) => {
                      const isSelected = editingDiscount.applicableItems?.includes(item.id);
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`item-${item.id}`}
                            checked={isSelected}
                            className="w-4 h-4 accent-primary cursor-pointer"
                            onChange={() => {
                              const current = editingDiscount.applicableItems || [];
                              const updated = isSelected
                                ? current.filter((id: string) => id !== item.id)
                                : [...current, item.id];
                              setEditingDiscount({ ...editingDiscount, applicableItems: updated });
                            }}
                          />
                          <label htmlFor={`item-${item.id}`} className="text-xs text-warm-700 cursor-pointer flex justify-between w-full">
                            <span>{item.name}</span>
                            <span className="text-warm-400 font-mono">({item.category?.name || "General"})</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="ruleActive"
                    checked={editingDiscount.isActive}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, isActive: e.target.checked })}
                    className="w-4.5 h-4.5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="ruleActive" className="text-sm font-semibold text-warm-700 cursor-pointer">
                    Enable this discount rule immediately
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-warm-100">
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="px-5 py-2.5 border border-warm-200 hover:bg-warm-50 text-warm-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white hover:bg-[#cc1530] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="w-full">
      <label className="text-xs font-semibold text-warm-600 mb-1.5 block">
        {label} {required && <span className="text-primary font-bold">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200"
      />
    </div>
  );
}
