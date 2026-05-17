"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, Ticket, Tag, ArrowRight } from "lucide-react";

interface OffersListProps {
  heroSlides: any[];
  splashAds: any[];
  coupons: any[];
}

export default function OffersList({ heroSlides, splashAds, coupons }: OffersListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Splash Ads - High Impact Offers */}
      {splashAds.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6 ml-2">
            <Ticket className="w-6 h-6 text-[#E31837]" />
            <h2 className="text-2xl font-bold text-warm-900 tracking-tight">Special Promotions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {splashAds.map((ad) => (
              <motion.div key={ad.id} variants={item} className="relative group rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 aspect-[16/9] md:aspect-auto md:h-[280px]">
                <Image 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${ad.gradient || "from-black/80 via-black/40 to-transparent"} opacity-80`} />
                
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {ad.title}
                  </h3>
                  {ad.subtitle && (
                    <p className="text-white/90 text-sm md:text-base font-medium mt-2 drop-shadow">
                      {ad.subtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    {ad.code && (
                      <button 
                        onClick={() => handleCopy(ad.code)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg"
                      >
                        {copiedCode === ad.code ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-400" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> {ad.code}</>
                        )}
                      </button>
                    )}
                    {ad.linkUrl ? (
                      <Link href={ad.linkUrl} className="ml-auto bg-[#E31837] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#C8102E] transition-colors shadow-lg flex items-center gap-1.5">
                        Claim Offer <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link href="/menu" className="ml-auto bg-[#E31837] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#C8102E] transition-colors shadow-lg flex items-center gap-1.5">
                        Order Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Hero Slides - Featured Deals */}
      {heroSlides.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6 ml-2">
            <Tag className="w-6 h-6 text-[#E31837]" />
            <h2 className="text-2xl font-bold text-warm-900 tracking-tight">Featured Deals</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroSlides.map((slide) => (
              <motion.div key={slide.id} variants={item} className="bg-white rounded-[1.5rem] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-warm-100 flex flex-col">
                <div className="relative aspect-[4/3] w-full">
                  <Image 
                    src={slide.imageUrl} 
                    alt={slide.title} 
                    fill 
                    className="object-cover"
                  />
                  {slide.tag && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-md">
                      {slide.tag}
                    </div>
                  )}
                  {slide.discount && (
                    <div className="absolute bottom-4 right-4 bg-[#E31837] text-white px-3 py-1.5 rounded-lg text-sm font-black shadow-lg">
                      {slide.discount}
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl text-warm-900 leading-tight mb-2">
                    {slide.title}
                  </h3>
                  {slide.description && (
                    <p className="text-warm-500 text-sm mb-4 line-clamp-2">
                      {slide.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <Link href={slide.linkUrl || "/menu"} className="w-full inline-flex items-center justify-center gap-2 bg-warm-100 text-warm-800 hover:bg-[#E31837] hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                      Grab Deal
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Database Coupons */}
      {coupons.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6 ml-2">
            <Ticket className="w-6 h-6 text-[#E31837]" />
            <h2 className="text-2xl font-bold text-warm-900 tracking-tight">Promo Codes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <motion.div key={coupon.id} variants={item} className="bg-white rounded-2xl p-5 border border-dashed border-warm-300 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#E31837]" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-black text-warm-900">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </span>
                    <span className="text-sm font-bold text-warm-500 uppercase">OFF</span>
                  </div>
                  {coupon.description && (
                    <p className="text-xs text-warm-500 line-clamp-1">{coupon.description}</p>
                  )}
                  <p className="text-[10px] text-warm-400 mt-2 font-medium">
                    Min order: ₹{coupon.minimumOrder} {coupon.maxDiscount ? `| Max discount: ₹${coupon.maxDiscount}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-warm-100 border border-warm-200 text-warm-800 px-3 py-1.5 rounded-lg font-mono font-bold text-sm tracking-widest uppercase">
                    {coupon.code}
                  </div>
                  <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="text-[#E31837] text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedCode === coupon.code ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {splashAds.length === 0 && heroSlides.length === 0 && coupons.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-warm-400" />
          </div>
          <h2 className="text-xl font-bold text-warm-900 mb-2">No active offers right now</h2>
          <p className="text-warm-500">Check back later for exciting deals and discounts!</p>
          <Link href="/menu" className="inline-block mt-6 bg-[#E31837] text-white px-6 py-3 rounded-xl font-bold shadow-lg">
            Explore Menu
          </Link>
        </div>
      )}
    </motion.div>
  );
}
