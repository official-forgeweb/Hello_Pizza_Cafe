"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useAdminStore } from "@/store/admin";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function AdminToasts() {
  const { toasts, removeToast } = useAdminStore();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${COLORS[toast.type]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-0.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
