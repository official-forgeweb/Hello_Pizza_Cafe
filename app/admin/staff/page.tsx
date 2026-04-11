"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Save, Loader2, Users, Phone, Mail,
  Truck, ChefHat, Shield, Star,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "DELIVERY" | "KITCHEN" | "MANAGER";
  avatar: string | null;
  isActive: boolean;
  ordersHandled: number;
  rating: number;
  joinedAt: string;
  _count?: { assignedOrders: number };
}

type EditStaff = Partial<Staff> & { isNew?: boolean };

const ROLE_CONFIG = {
  DELIVERY: { label: "Delivery", icon: Truck, color: "bg-blue-100 text-blue-700" },
  KITCHEN: { label: "Kitchen", icon: ChefHat, color: "bg-orange-100 text-orange-700" },
  MANAGER: { label: "Manager", icon: Shield, color: "bg-purple-100 text-purple-700" },
};

const ROLE_TABS = ["ALL", "DELIVERY", "KITCHEN", "MANAGER"] as const;

export default function StaffPage() {
  const { addToast } = useAdminStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>("ALL");
  const [editStaff, setEditStaff] = useState<EditStaff | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/admin/staff?role=${activeRole}`);
      if (res.ok) setStaff(await res.json());
    } catch {
      addToast("Failed to load staff", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [activeRole]);

  const handleSave = async () => {
    if (!editStaff) return;
    setSaving(true);
    try {
      const url = editStaff.isNew ? "/api/admin/staff" : `/api/admin/staff/${editStaff.id}`;
      const res = await fetch(url, {
        method: editStaff.isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStaff),
      });
      if (res.ok) {
        addToast(editStaff.isNew ? "Staff added!" : "Staff updated!", "success");
        fetchStaff();
        setEditStaff(null);
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
    if (!confirm("Deactivate this staff member?")) return;
    try {
      await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      addToast("Staff deactivated", "success");
      fetchStaff();
    } catch {
      addToast("Failed to deactivate", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-warm-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-warm-200 rounded-2xl animate-pulse" />
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
          <h1 className="text-2xl font-bold text-warm-900">Staff Management</h1>
          <p className="text-warm-500 text-sm mt-1">
            {staff.length} team members • {staff.filter((s) => s.isActive).length} active
          </p>
        </div>
        <motion.button
          onClick={() => setEditStaff({ isNew: true, name: "", phone: "", role: "DELIVERY", isActive: true })}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#cc1530] transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </motion.button>
      </div>

      {/* Role Tabs */}
      <div className="flex bg-warm-100 rounded-xl p-1 w-fit">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveRole(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeRole === tab ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-700"
            }`}
          >
            {tab === "ALL" ? "All" : ROLE_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* Staff Cards */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-warm-200/60" style={{ boxShadow: "var(--shadow-card)" }}>
          <Users className="w-12 h-12 text-warm-300 mx-auto mb-3" />
          <p className="font-semibold text-warm-700">No staff members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member, i) => {
            const role = ROLE_CONFIG[member.role];
            const RoleIcon = role.icon;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border p-5 ${
                  member.isActive ? "border-warm-200/60" : "border-warm-200/40 opacity-60"
                }`}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-orange/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-warm-900 text-sm truncate">{member.name}</h3>
                      {!member.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-warm-200 text-warm-500">Inactive</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1 ${role.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-warm-500">
                    <Phone className="w-3.5 h-3.5" />
                    {member.phone}
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs text-warm-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 pt-3 border-t border-warm-100">
                  <div className="text-center flex-1">
                    <p className="text-lg font-bold text-warm-900">{member.ordersHandled}</p>
                    <p className="text-[10px] text-warm-500">Orders</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-bold text-warm-900">{member.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-warm-500">Rating</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditStaff(member)}
                    className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editStaff && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditStaff(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
                  <h2 className="font-bold text-warm-900 text-lg">{editStaff.isNew ? "Add Staff" : "Edit Staff"}</h2>
                  <button onClick={() => setEditStaff(null)} className="p-2 rounded-lg hover:bg-warm-100 cursor-pointer">
                    <X className="w-5 h-5 text-warm-500" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Name *</label>
                    <input type="text" value={editStaff.name || ""}
                      onChange={(e) => setEditStaff((p) => p && { ...p, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Phone *</label>
                      <input type="text" value={editStaff.phone || ""}
                        onChange={(e) => setEditStaff((p) => p && { ...p, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-warm-600 mb-1.5 block">Role</label>
                      <select value={editStaff.role || "DELIVERY"}
                        onChange={(e) => setEditStaff((p) => p && { ...p, role: e.target.value as any })}
                        className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                        <option value="DELIVERY">Delivery</option>
                        <option value="KITCHEN">Kitchen</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-warm-600 mb-1.5 block">Email</label>
                    <input type="email" value={editStaff.email || ""}
                      onChange={(e) => setEditStaff((p) => p && { ...p, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-warm-50 rounded-xl text-sm border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="p-5 border-t border-warm-200/50 flex items-center justify-end gap-3">
                  <button onClick={() => setEditStaff(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-warm-600 hover:bg-warm-100 cursor-pointer">Cancel</button>
                  <motion.button onClick={handleSave} disabled={saving || !editStaff.name || !editStaff.phone}
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
