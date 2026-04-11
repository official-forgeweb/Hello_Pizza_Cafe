"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, MapPin, Clock, Phone, Mail, Globe } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    restaurantName: "Hello Pizza",
    phone: "+91 98765 43210",
    email: "hello@hellopizza.in",
    address: "Shop 12, Connaught Place, New Delhi 110001",
    website: "https://hellopizza.in",
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

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Settings</h1>
        <p className="text-warm-500 text-sm mt-1">Configure your restaurant</p>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white rounded-2xl p-6 border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-semibold text-warm-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Restaurant Information
        </h2>
        <div className="space-y-4">
          <Field label="Restaurant Name" value={settings.restaurantName} onChange={(v) => update("restaurantName", v)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone" value={settings.phone} onChange={(v) => update("phone", v)} icon={<Phone className="w-4 h-4" />} />
            <Field label="Email" value={settings.email} onChange={(v) => update("email", v)} icon={<Mail className="w-4 h-4" />} />
          </div>
          <Field label="Address" value={settings.address} onChange={(v) => update("address", v)} />
          <Field label="Website" value={settings.website} onChange={(v) => update("website", v)} icon={<Globe className="w-4 h-4" />} />
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-2xl p-6 border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-semibold text-warm-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Operating Hours & Delivery
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Time" value={settings.openingTime} onChange={(v) => update("openingTime", v)} type="time" />
            <Field label="Closing Time" value={settings.closingTime} onChange={(v) => update("closingTime", v)} type="time" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Delivery Radius (km)" value={settings.deliveryRadius} onChange={(v) => update("deliveryRadius", v)} type="number" />
            <Field label="Min Order (₹)" value={settings.minOrderAmount} onChange={(v) => update("minOrderAmount", v)} type="number" />
            <Field label="Free Delivery Min (₹)" value={settings.freeDeliveryMin} onChange={(v) => update("freeDeliveryMin", v)} type="number" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Delivery Fee (₹)" value={settings.deliveryFee} onChange={(v) => update("deliveryFee", v)} type="number" />
            <Field label="Tax Rate (%)" value={settings.taxRate} onChange={(v) => update("taxRate", v)} type="number" />
            <Field label="Prep Time (min)" value={settings.estimatedPrepTime} onChange={(v) => update("estimatedPrepTime", v)} type="number" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70"
        whileTap={{ scale: 0.95 }}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : (
          <><Save className="w-4 h-4" /> Save Settings</>
        )}
      </motion.button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-warm-600 mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${icon ? "pl-10" : "px-4"} pr-4 py-2.5 bg-warm-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-warm-200`}
        />
      </div>
    </div>
  );
}
