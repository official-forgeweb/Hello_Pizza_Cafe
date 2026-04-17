"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Tag,
  Settings,
  LogOut,
  ChevronLeft,
  Menu as MenuIcon,
  X,
  Image as ImageIcon,
  Users,
  Layers,
  Puzzle,
  UserCheck,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";
import AdminToasts from "@/components/admin/Toast";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: UserCheck },
  { href: "/admin/menu", label: "Menu Items", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/addons", label: "Add-ons", icon: Puzzle },
  { href: "/admin/hero", label: "Hero CMS", icon: ImageIcon },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, checkSession, logout } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (pathname !== "/admin/login") {
      checkSession();
    }
  }, [pathname, checkSession]);

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-500 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!admin) {
    if (typeof window !== "undefined") {
      router.push("/admin/login");
    }
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-500 text-sm font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  const currentPage = NAV_ITEMS.find((item) => item.href === pathname)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Toast notifications */}
      <AdminToasts />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-warm-200/60 transition-all duration-300 sticky top-0 h-screen ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tight text-warm-900">
              Hello<span className="text-primary">Pizza</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer text-warm-500"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-warm-600 hover:bg-warm-100 hover:text-warm-800"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="adminNavActive"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.15 }}
                    />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
                  {!collapsed && (
                    <span className="relative z-10">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Admin Info + Sign Out */}
        <div className="p-3 border-t border-warm-200/50 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-warm-900 truncate">{admin.name}</p>
              <p className="text-[10px] text-warm-500 truncate">{admin.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-warm-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[60] lg:hidden flex flex-col"
            >
              <div className="p-5 border-b border-warm-200/50 flex items-center justify-between">
                <span className="text-lg font-extrabold tracking-tight text-warm-900">
                  Hello<span className="text-primary">Pizza</span>
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-warm-500" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-warm-600 hover:bg-warm-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-warm-200/50 space-y-2">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-warm-900">{admin.name}</p>
                  <p className="text-[10px] text-warm-500">{admin.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-warm-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-warm-200/50 px-4 md:px-6 py-4 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
          >
            <MenuIcon className="w-5 h-5 text-warm-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-warm-900">{currentPage}</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#cc1530] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-warm-700 hidden md:inline">
              {admin.name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
