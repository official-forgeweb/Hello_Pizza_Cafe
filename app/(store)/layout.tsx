"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StickyCartBar from "@/components/cart/StickyCartBar";
import { motion } from "framer-motion";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <Footer />
      <StickyCartBar />
    </>
  );
}
