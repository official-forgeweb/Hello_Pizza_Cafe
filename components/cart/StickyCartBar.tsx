"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function StickyCartBar() {
  const items = useCartStore((s) => s.items);
  const getCartTotal = useCartStore((s) => s.getCartTotal);
  const getCartCount = useCartStore((s) => s.getCartCount);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const count = getCartCount();
  const total = getCartTotal();

  if (pathname === "/cart" || pathname === "/checkout") return null;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-bottom)]"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-4">
            <div className="bg-warm-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
              {/* Left — Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2 text-white">
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-medium text-sm"
                  >
                    {count} {count === 1 ? "item" : "items"}
                  </motion.span>
                  <span className="w-1 h-1 bg-warm-500 rounded-full" />
                  <motion.span
                    key={total}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-bold text-lg"
                  >
                    ₹{total.toFixed(0)}
                  </motion.span>
                </div>
              </div>

              {/* Right — CTA */}
              <Link href="/cart">
                <motion.button
                  className="flex items-center gap-2 bg-primary hover:bg-[#cc1530] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Cart
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
