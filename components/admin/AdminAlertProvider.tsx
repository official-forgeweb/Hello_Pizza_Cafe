"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type AlertType = "success" | "error" | "warning" | "info";

interface AlertState {
  id: number;
  message: string;
  type: AlertType;
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  resolve: (value: boolean) => void;
}

interface AdminAlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
  showConfirm: (message: string, title?: string, options?: { confirmLabel?: string; cancelLabel?: string; type?: "danger" | "warning" | "info" }) => Promise<boolean>;
}

const AdminAlertContext = createContext<AdminAlertContextType | null>(null);

export function useAdminAlert() {
  const ctx = useContext(AdminAlertContext);
  if (!ctx) throw new Error("useAdminAlert must be used inside AdminAlertProvider");
  return ctx;
}

// ─── Icons ───────────────────────────────────────────────────
const ALERT_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    iconColor: "text-emerald-500",
    progress: "bg-emerald-400",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    iconColor: "text-red-500",
    progress: "bg-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    iconColor: "text-amber-500",
    progress: "bg-amber-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    iconColor: "text-blue-500",
    progress: "bg-blue-400",
  },
};

const CONFIRM_CONFIG = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    btnBg: "bg-red-600 hover:bg-red-700",
    btnFocus: "focus:ring-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    btnBg: "bg-amber-600 hover:bg-amber-700",
    btnFocus: "focus:ring-amber-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    btnBg: "bg-blue-600 hover:bg-blue-700",
    btnFocus: "focus:ring-blue-500",
  },
};

// ─── Provider ────────────────────────────────────────────────
export default function AdminAlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idCounter = useRef(0);

  // ── Toast alert ──
  const showAlert = useCallback((message: string, type: AlertType = "info") => {
    const id = ++idCounter.current;
    setAlerts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 visible
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4000);
  }, []);

  // ── Confirm dialog ──
  const showConfirm = useCallback((message: string, title?: string, options?: { confirmLabel?: string; cancelLabel?: string; type?: "danger" | "warning" | "info" }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: title || "Confirm Action",
        message,
        confirmLabel: options?.confirmLabel || "Confirm",
        cancelLabel: options?.cancelLabel || "Cancel",
        type: options?.type || "danger",
        resolve,
      });
    });
  }, []);

  const handleConfirmResolve = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AdminAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* ─── Toast Alerts ─── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className={`pointer-events-auto relative ${config.bg} ${config.border} border rounded-xl shadow-lg overflow-hidden`}
              >
                <div className="flex items-start gap-3 p-4">
                  <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />
                  <p className={`text-sm font-medium ${config.text} flex-1 leading-relaxed`}>
                    {alert.message}
                  </p>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-warm-400" />
                  </button>
                </div>
                {/* Auto-dismiss progress bar */}
                <motion.div
                  className={`h-0.5 ${config.progress}`}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── Confirm Dialog ─── */}
      <AnimatePresence>
        {confirmState && (() => {
          const config = CONFIRM_CONFIG[confirmState.type || "danger"];
          const Icon = config.icon;
          return (
            <motion.div
              key="confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => handleConfirmResolve(false)}
              />

              {/* Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 28, stiffness: 400 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>

                  {/* Title & Message */}
                  <h3 className="text-lg font-bold text-warm-900 mb-2">
                    {confirmState.title}
                  </h3>
                  <p className="text-sm text-warm-500 leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-4 pt-0">
                  <button
                    onClick={() => handleConfirmResolve(false)}
                    className="flex-1 px-4 py-2.5 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {confirmState.cancelLabel}
                  </button>
                  <button
                    onClick={() => handleConfirmResolve(true)}
                    className={`flex-1 px-4 py-2.5 ${config.btnBg} text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm`}
                  >
                    {confirmState.confirmLabel}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </AdminAlertContext.Provider>
  );
}
