"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  MapPin,
  Compass,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  DollarSign,
  Navigation,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";
import { DeliveryConfig, DeliveryZone } from "@/lib/delivery";

export default function DeliverySettingsPage() {
  const { addToast } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeliveryConfig>({
    cafeLocation: { lat: 28.3418, lng: 77.3241 },
    maxDeliveryRadiusKm: 20,
    driverPayoutPerKm: 4,
    fallbackDeliveryFee: 50,
    isDistanceBasedEnabled: true,
  });
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [detecting, setDetecting] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/delivery-settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.zones) setZones(data.zones);
      } catch (err) {
        console.error(err);
        addToast("Failed to load delivery settings", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [addToast]);

  // Handle Geolocation coordinate detection
  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      addToast("Geolocation is not supported by your browser", "error");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setConfig((prev) => ({
          ...prev,
          cafeLocation: {
            lat: Math.round(position.coords.latitude * 1000000) / 1000000,
            lng: Math.round(position.coords.longitude * 1000000) / 1000000,
          },
        }));
        addToast("Location detected successfully!", "success");
        setDetecting(false);
      },
      (error) => {
        console.error(error);
        addToast("Permission denied or location unavailable", "error");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Add a new empty zone
  const handleAddZone = () => {
    const nextMaxDist = zones.length > 0 ? zones[zones.length - 1].maxDistanceKm + 5 : 5;
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      label: `Zone ${zones.length + 1} (${zones.length > 0 ? zones[zones.length - 1].maxDistanceKm : 0}-${nextMaxDist} km)`,
      maxDistanceKm: nextMaxDist,
      deliveryFee: 40,
      freeDeliveryMinOrder: 500,
      minOrderAmount: 199,
      driverPayout: 25,
      isActive: true,
    };
    setZones([...zones, newZone]);
  };

  // Delete a zone
  const handleDeleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  // Update a zone field value
  const handleUpdateZone = (id: string, field: keyof DeliveryZone, value: any) => {
    setZones(
      zones.map((z) => {
        if (z.id !== id) return z;
        return { ...z, [field]: value };
      })
    );
  };

  // Save everything
  const handleSave = async () => {
    // Basic validation
    if (config.maxDeliveryRadiusKm <= 0) {
      addToast("Maximum delivery radius must be greater than 0", "error");
      return;
    }

    if (zones.length === 0) {
      addToast("You must define at least one delivery zone", "error");
      return;
    }

    // Sort zones by distance for sanity check
    const sortedZones = [...zones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

    // Validate zone entries
    for (let i = 0; i < sortedZones.length; i++) {
      const z = sortedZones[i];
      if (!z.label.trim()) {
        addToast(`Zone at index ${i + 1} must have a label`, "error");
        return;
      }
      if (z.maxDistanceKm <= 0) {
        addToast(`Zone "${z.label}" must have a distance greater than 0`, "error");
        return;
      }
      if (z.deliveryFee < 0 || z.freeDeliveryMinOrder < 0 || z.minOrderAmount < 0 || z.driverPayout < 0) {
        addToast(`Zone "${z.label}" cannot contain negative amounts`, "error");
        return;
      }
      if (i > 0 && z.maxDistanceKm <= sortedZones[i - 1].maxDistanceKm) {
        addToast(`Zone "${z.label}" max distance must be greater than the previous zone (${sortedZones[i - 1].maxDistanceKm} km)`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, zones: sortedZones }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }

      const data = await res.json();
      setConfig(data.config);
      setZones(data.zones);
      addToast("Delivery settings saved successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Error saving delivery settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-warm-500 text-sm font-medium">Loading delivery engine configuration...</p>
      </div>
    );
  }

  // Sorted list for visualization
  const sortedZones = [...zones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Delivery Settings
          </h1>
          <p className="text-warm-500 text-sm mt-1">
            Manage distance-based charges, delivery radius, driver payouts, and delivery zones.
          </p>
        </div>

        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer disabled:opacity-70 shadow-sm"
          whileTap={{ scale: 0.97 }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Settings
            </>
          )}
        </motion.button>
      </div>

      {/* Main Grid: Global Settings Left, Zones Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Settings Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
            <h2 className="font-bold text-warm-900 flex items-center gap-2 pb-3 border-b border-warm-100">
              <Compass className="w-4 h-4 text-primary" />
              Global Engine Settings
            </h2>

            {/* Distance Toggle Switch */}
            <div className="flex items-center justify-between p-3.5 bg-warm-50 rounded-2xl border border-warm-200/40">
              <div>
                <label className="text-sm font-semibold text-warm-900 block">Distance-based Pricing</label>
                <span className="text-xs text-warm-500 block mt-0.5">Toggle tiered vs flat pricing</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, isDistanceBasedEnabled: !prev.isDistanceBasedEnabled }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.isDistanceBasedEnabled ? "bg-primary" : "bg-warm-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.isDistanceBasedEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Cafe Coordinates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold tracking-wide text-warm-700 uppercase">Cafe GPS Location</label>
                <button
                  type="button"
                  onClick={handleDetectCoordinates}
                  disabled={detecting}
                  className="text-xs font-semibold text-primary hover:text-[#cc1530] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {detecting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3 h-3" /> Get Current GPS
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-medium text-warm-400 mb-1 block">Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={config.cafeLocation.lat}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cafeLocation: { ...prev.cafeLocation, lat: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-warm-400 mb-1 block">Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={config.cafeLocation.lng}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cafeLocation: { ...prev.cafeLocation, lng: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                  />
                </div>
              </div>
              <span className="text-[10px] text-warm-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0 text-warm-400" />
                This serves as the center point for calculating distance.
              </span>
            </div>

            {/* Other parameters */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold tracking-wide text-warm-700 uppercase block mb-1.5">
                  Max Delivery Radius (km)
                </label>
                <div className="relative rounded-xl">
                  <input
                    type="number"
                    min="1"
                    value={config.maxDeliveryRadiusKm}
                    onChange={(e) => setConfig((prev) => ({ ...prev, maxDeliveryRadiusKm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-warm-400 font-medium">km</span>
                  </div>
                </div>
                <span className="text-[10px] text-warm-400 block mt-1">
                  Orders beyond this distance will be rejected automatically.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold tracking-wide text-warm-700 uppercase block mb-1.5">
                  Fallback Flat Delivery Fee (₹)
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-xs text-warm-400 font-bold">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={config.fallbackDeliveryFee}
                    onChange={(e) => setConfig((prev) => ({ ...prev, fallbackDeliveryFee: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-7 pr-3 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                  />
                </div>
                <span className="text-[10px] text-warm-400 block mt-1">
                  Applied when distance-based is off or customer coords are missing.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold tracking-wide text-warm-700 uppercase block mb-1.5">
                  Driver Payout Rate Per KM (₹)
                </label>
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-xs text-warm-400 font-bold">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={config.driverPayoutPerKm}
                    onChange={(e) => setConfig((prev) => ({ ...prev, driverPayoutPerKm: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-7 pr-3 py-2.5 bg-warm-50 border border-warm-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-[10px] text-warm-400 font-semibold">/ km</span>
                  </div>
                </div>
                <span className="text-[10px] text-warm-400 block mt-1">
                  Fallback payout rate per kilometer for the delivery boy.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 flex gap-3 text-amber-800">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <span className="font-bold block">How Calculation Works:</span>
              <p className="leading-relaxed">
                When a customer checks out, the cafe calculates the straight-line distance (Haversine Formula) from their GPS coordinates.
              </p>
              <p className="leading-relaxed">
                The engine matches the distance against the sorted active zones defined on the right to apply fees and minimum order amounts.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Zones CRUD Settings Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-warm-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <h2 className="font-bold text-warm-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Delivery Zones & Tier Rules
              </h2>
              <button
                onClick={handleAddZone}
                className="flex items-center gap-1.5 bg-warm-100 text-warm-700 hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Zone
              </button>
            </div>

            {/* Visual Ruler */}
            {sortedZones.length > 0 && (
              <div className="bg-warm-50 rounded-2xl p-4 border border-warm-200/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-warm-600">
                  <span>Distance Coverage: 0 km</span>
                  <span>Max Radius: {config.maxDeliveryRadiusKm} km</span>
                </div>
                <div className="relative h-6 bg-warm-200 rounded-full flex overflow-hidden border border-warm-300">
                  {sortedZones.map((z, idx) => {
                    const prevMax = idx === 0 ? 0 : sortedZones[idx - 1].maxDistanceKm;
                    const widthPercent = Math.min(
                      100,
                      ((z.maxDistanceKm - prevMax) / config.maxDeliveryRadiusKm) * 100
                    );
                    if (widthPercent <= 0) return null;
                    return (
                      <div
                        key={z.id}
                        className={`h-full flex items-center justify-center text-[10px] font-bold text-white transition-all select-none border-r border-white/20 last:border-0 ${
                          !z.isActive
                            ? "bg-warm-400 opacity-55"
                            : idx === 0
                            ? "bg-emerald-500"
                            : idx === 1
                            ? "bg-teal-500"
                            : idx === 2
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                        title={`${z.label}: ${prevMax}-${z.maxDistanceKm} km`}
                      >
                        {z.maxDistanceKm}km
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center justify-start text-[11px] font-semibold text-warm-500">
                  {sortedZones.map((z, idx) => (
                    <div key={z.id} className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                          !z.isActive
                            ? "bg-warm-400"
                            : idx === 0
                            ? "bg-emerald-500"
                            : idx === 1
                            ? "bg-teal-500"
                            : idx === 2
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className={!z.isActive ? "line-through opacity-60" : ""}>
                        {z.label} (≤ {z.maxDistanceKm}km)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone List */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {sortedZones.length === 0 ? (
                  <div className="text-center py-10 text-warm-400 bg-warm-50/50 rounded-2xl border border-dashed border-warm-200">
                    <AlertTriangle className="w-8 h-8 text-warm-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No Delivery Zones Configured</p>
                    <p className="text-xs text-warm-400 mt-1">Click "Add Zone" above to define your first delivery zone.</p>
                  </div>
                ) : (
                  sortedZones.map((z, idx) => (
                    <motion.div
                      key={z.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-5 rounded-2xl border transition-all relative ${
                        !z.isActive
                          ? "bg-warm-50/80 border-warm-200/50 opacity-70"
                          : "bg-white border-warm-200 hover:border-primary/30 shadow-[0_2px_8px_rgba(0,0,0,0.015)]"
                      }`}
                    >
                      {/* Top Header Row within Zone Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-warm-100/70">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={z.label}
                            onChange={(e) => handleUpdateZone(z.id, "label", e.target.value)}
                            placeholder="Zone Name (e.g. Nearby, Extended)"
                            className="text-sm font-bold text-warm-900 bg-transparent border-b border-transparent hover:border-warm-300 focus:border-primary focus:outline-none w-full max-w-xs transition-colors"
                          />
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          {/* Active Toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-warm-500 uppercase">Active</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateZone(z.id, "isActive", !z.isActive)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                z.isActive ? "bg-emerald-500" : "bg-warm-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  z.isActive ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteZone(z.id)}
                            className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div>
                          <label className="text-[10px] font-bold tracking-wider text-warm-500 uppercase mb-1.5 block">
                            Max Distance
                          </label>
                          <div className="relative rounded-xl">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={z.maxDistanceKm}
                              onChange={(e) => handleUpdateZone(z.id, "maxDistanceKm", parseFloat(e.target.value) || 0)}
                              className="w-full pr-7 pl-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                              <span className="text-[10px] text-warm-400 font-semibold">km</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold tracking-wider text-warm-500 uppercase mb-1.5 block">
                            Delivery Fee
                          </label>
                          <div className="relative rounded-xl">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-[10px] text-warm-400 font-bold">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={z.deliveryFee}
                              onChange={(e) => handleUpdateZone(z.id, "deliveryFee", parseInt(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold tracking-wider text-warm-500 uppercase mb-1.5 block" title="Free Delivery Minimum Order">
                            Free Delivery Min
                          </label>
                          <div className="relative rounded-xl">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-[10px] text-warm-400 font-bold">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={z.freeDeliveryMinOrder}
                              onChange={(e) => handleUpdateZone(z.id, "freeDeliveryMinOrder", parseInt(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold tracking-wider text-warm-500 uppercase mb-1.5 block">
                            Min Order Req
                          </label>
                          <div className="relative rounded-xl">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-[10px] text-warm-400 font-bold">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={z.minOrderAmount}
                              onChange={(e) => handleUpdateZone(z.id, "minOrderAmount", parseInt(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                            />
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-bold tracking-wider text-warm-500 uppercase mb-1.5 block" title="Amount paid to delivery driver">
                            Driver Payout
                          </label>
                          <div className="relative rounded-xl">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-[10px] text-warm-400 font-bold">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={z.driverPayout}
                              onChange={(e) => handleUpdateZone(z.id, "driverPayout", parseInt(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-warm-800"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
