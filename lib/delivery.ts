// ============================================
// Delivery Calculation Engine
// Haversine distance + zone-based fee matching
// ============================================

export interface DeliveryZone {
  id: string;
  label: string;
  maxDistanceKm: number;
  deliveryFee: number;
  freeDeliveryMinOrder: number;
  minOrderAmount: number;
  driverPayout: number;
  isActive: boolean;
}

export interface DeliveryConfig {
  cafeLocation: { lat: number; lng: number };
  maxDeliveryRadiusKm: number;
  driverPayoutPerKm: number;
  fallbackDeliveryFee: number;
  isDistanceBasedEnabled: boolean;
}

export interface DeliveryFeeResult {
  distanceKm: number;
  zone: DeliveryZone | null;
  deliveryFee: number;
  freeDeliveryMinOrder: number;
  minOrderAmount: number;
  isFreeDelivery: boolean;
  isDeliverable: boolean;
  driverPayout: number;
  message: string;
}

/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimals
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Determine the delivery fee based on distance and order total.
 * Zones must be sorted by maxDistanceKm ascending.
 */
export function calculateDeliveryFee(
  distanceKm: number,
  orderTotal: number,
  zones: DeliveryZone[],
  config: DeliveryConfig
): DeliveryFeeResult {
  // If distance-based pricing is disabled, use fallback
  if (!config.isDistanceBasedEnabled) {
    return {
      distanceKm,
      zone: null,
      deliveryFee: config.fallbackDeliveryFee,
      freeDeliveryMinOrder: 0,
      minOrderAmount: 0,
      isFreeDelivery: false,
      isDeliverable: true,
      driverPayout: Math.round(distanceKm * config.driverPayoutPerKm),
      message: "Flat delivery fee applied",
    };
  }

  // Beyond max radius
  if (distanceKm > config.maxDeliveryRadiusKm) {
    return {
      distanceKm,
      zone: null,
      deliveryFee: 0,
      freeDeliveryMinOrder: 0,
      minOrderAmount: 0,
      isFreeDelivery: false,
      isDeliverable: false,
      driverPayout: 0,
      message: `Delivery is not available beyond ${config.maxDeliveryRadiusKm} km. Your distance: ${distanceKm} km`,
    };
  }

  // Find matching zone (first zone where distance <= maxDistanceKm)
  const activeZones = zones
    .filter((z) => z.isActive)
    .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);

  const matchedZone = activeZones.find((z) => distanceKm <= z.maxDistanceKm);

  if (!matchedZone) {
    // No zone covers this distance, use fallback
    return {
      distanceKm,
      zone: null,
      deliveryFee: config.fallbackDeliveryFee,
      freeDeliveryMinOrder: 0,
      minOrderAmount: 0,
      isFreeDelivery: false,
      isDeliverable: true,
      driverPayout: Math.round(distanceKm * config.driverPayoutPerKm),
      message: "Default delivery fee applied",
    };
  }

  // Check minimum order
  if (orderTotal < matchedZone.minOrderAmount) {
    return {
      distanceKm,
      zone: matchedZone,
      deliveryFee: matchedZone.deliveryFee,
      freeDeliveryMinOrder: matchedZone.freeDeliveryMinOrder,
      minOrderAmount: matchedZone.minOrderAmount,
      isFreeDelivery: false,
      isDeliverable: false,
      driverPayout: matchedZone.driverPayout,
      message: `Minimum order for your area (${matchedZone.label}) is ₹${matchedZone.minOrderAmount}`,
    };
  }

  // Check if free delivery applies
  const isFreeDelivery = orderTotal >= matchedZone.freeDeliveryMinOrder;

  return {
    distanceKm,
    zone: matchedZone,
    deliveryFee: isFreeDelivery ? 0 : matchedZone.deliveryFee,
    freeDeliveryMinOrder: matchedZone.freeDeliveryMinOrder,
    minOrderAmount: matchedZone.minOrderAmount,
    isFreeDelivery,
    isDeliverable: true,
    driverPayout: matchedZone.driverPayout,
    message: isFreeDelivery
      ? "🎉 Free delivery on this order!"
      : `Delivery fee: ₹${matchedZone.deliveryFee} (${matchedZone.label}). Order ₹${matchedZone.freeDeliveryMinOrder}+ for free delivery!`,
  };
}

/**
 * Default delivery config (used when no DB settings exist)
 */
export function getDefaultDeliveryConfig(): DeliveryConfig {
  return {
    cafeLocation: {
      lat: parseFloat(process.env.NEXT_PUBLIC_CAFE_LAT || "28.3418"),
      lng: parseFloat(process.env.NEXT_PUBLIC_CAFE_LNG || "77.3241"),
    },
    maxDeliveryRadiusKm: 20,
    driverPayoutPerKm: 4,
    fallbackDeliveryFee: 50,
    isDistanceBasedEnabled: true,
  };
}

/**
 * Default delivery zones
 */
export function getDefaultDeliveryZones(): DeliveryZone[] {
  return [
    {
      id: "zone-1",
      label: "Nearby (0–3 km)",
      maxDistanceKm: 3,
      deliveryFee: 20,
      freeDeliveryMinOrder: 200,
      minOrderAmount: 99,
      driverPayout: 15,
      isActive: true,
    },
    {
      id: "zone-2",
      label: "Medium (3–5 km)",
      maxDistanceKm: 5,
      deliveryFee: 30,
      freeDeliveryMinOrder: 400,
      minOrderAmount: 200,
      driverPayout: 20,
      isActive: true,
    },
    {
      id: "zone-3",
      label: "Far (5–10 km)",
      maxDistanceKm: 10,
      deliveryFee: 50,
      freeDeliveryMinOrder: 800,
      minOrderAmount: 500,
      driverPayout: 40,
      isActive: true,
    },
    {
      id: "zone-4",
      label: "Extended (10–20 km)",
      maxDistanceKm: 20,
      deliveryFee: 80,
      freeDeliveryMinOrder: 1500,
      minOrderAmount: 1000,
      driverPayout: 80,
      isActive: true,
    },
  ];
}
