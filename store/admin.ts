import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AdminState {
  admin: { id: string; email: string; name: string; role: string } | null;
  loading: boolean;
  toasts: Toast[];
  setAdmin: (admin: AdminState["admin"]) => void;
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: null,
  loading: true,
  toasts: [],

  setAdmin: (admin) => set({ admin }),
  setLoading: (loading) => set({ loading }),

  addToast: (message, type = "info") => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  logout: async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    set({ admin: null });
    window.location.href = "/admin/login";
  },

  checkSession: async () => {
    try {
      const res = await fetch("/api/admin/session");
      if (res.ok) {
        const data = await res.json();
        set({ admin: data.admin, loading: false });
      } else {
        set({ admin: null, loading: false });
      }
    } catch {
      set({ admin: null, loading: false });
    }
  },
}));
