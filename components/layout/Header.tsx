"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  Search, 
  MapPin, 
  X, 
  Menu as MenuIcon, 
  ChevronRight,
  Home as HomeIcon, 
  Pizza as PizzaIcon, 
  ShoppingCart as CartIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { useLocationStore } from "@/store/location";

export default function Header() {
  const cartCount = useCartStore((s) => s.getCartCount());
  const { address, isDetecting, detectLocation } = useLocationStore();
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    
    // Auto-detect on home page if not set
    if (isHome && !address && mounted) {
      detectLocation();
    }

    return () => window.removeEventListener("scroll", handler);
  }, [isHome, mounted, address, detectLocation]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass shadow-sm" : "bg-transparent border-transparent"
        }`}
        style={{ height: "var(--header-height)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left — Logo */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              suppressHydrationWarning={true}
            >
              <MenuIcon className="w-5 h-5 text-warm-700" />
            </button>

            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-warm-900">
                Hello<span className="text-primary">Pizza</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Menu" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href 
                      ? "text-primary bg-primary/5" 
                      : "text-warm-600 hover:text-warm-900 hover:bg-warm-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Dynamic Area: Search or Location */}
            <div className="hidden md:flex items-center">
              {isHome ? (
                /* Location Selector for Home */
                <button 
                  onClick={() => detectLocation()}
                  className="group flex flex-col items-start px-4 py-1.5 rounded-xl hover:bg-warm-100/50 transition-all cursor-pointer text-left border border-transparent hover:border-warm-200/50"
                  suppressHydrationWarning={true}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    <MapPin className="w-3 h-3" />
                    Deliver to
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold text-warm-900 truncate max-w-[180px] lg:max-w-[240px] ${isDetecting ? "animate-pulse opacity-50" : ""}`}>
                      {isDetecting ? "Detecting location..." : address || "Select location"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-warm-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ) : (
                /* Search for other pages */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = (e.target as any).search.value;
                    if (query.trim()) {
                      window.location.href = `/menu?q=${encodeURIComponent(query)}`;
                    }
                  }}
                  className="flex items-center"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                    <input
                      name="search"
                      type="text"
                      placeholder="Search menu..."
                      className="pl-9 pr-4 py-2 bg-warm-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white w-48 lg:w-56 transition-all placeholder:text-warm-400"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Mobile search icon */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
              suppressHydrationWarning={true}
            >
              <Search className="w-5 h-5 text-warm-600" />
            </button>

            {/* Cart button */}
            <Link href="/cart">
              <motion.div
                className="relative p-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                whileTap={{ scale: 0.92 }}
              >
                <ShoppingCart className="w-5 h-5 text-warm-700" />
                <AnimatePresence>
                  {mounted && cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full px-1"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 glass bg-white/95 z-[70] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-extrabold tracking-tight text-warm-900">
                  Hello<span className="text-primary">Pizza</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-lg hover:bg-warm-100 transition-colors cursor-pointer"
                  suppressHydrationWarning={true}
                >
                  <X className="w-5 h-5 text-warm-500" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {[
                  { href: "/", label: "Home", icon: HomeIcon },
                  { href: "/menu", label: "Our Menu", icon: PizzaIcon },
                  { href: "/cart", label: "My Cart", icon: CartIcon },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-warm-700 font-medium hover:bg-warm-100 transition-colors"
                  >
                    <span className="text-warm-500 w-6 h-6 flex items-center justify-center">
                      <link.icon className="w-5 h-5" />
                    </span>
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-warm-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-warm-500">
                  <MapPin className="w-4 h-4" />
                  {address || "Connaught Place, New Delhi"}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
