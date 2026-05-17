import prisma from "@/lib/prisma";
import OffersList from "./OffersList";

export const revalidate = 60; // Revalidate cache every minute

export const metadata = {
  title: "Offers & Deals | Hello Pizza",
  description: "Check out the latest offers, deals, and discounts at Hello Pizza.",
};

export default async function OffersPage() {
  // Fetch active offers concurrently
  const [heroSlides, splashAds, coupons] = await Promise.all([
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.splashAd.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-warm-50 pb-20">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white pt-12 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Exclusive Offers & Deals
          </h1>
          <p className="text-white/80 text-sm md:text-base font-medium max-w-xl mx-auto">
            Grab the best discounts on your favorite pizzas. Use these promo codes and deals to save big on your next order!
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <OffersList 
          heroSlides={heroSlides} 
          splashAds={splashAds} 
          coupons={coupons} 
        />
      </div>
    </div>
  );
}
