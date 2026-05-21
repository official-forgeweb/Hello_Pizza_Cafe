import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DeliveryConfig,
  DeliveryZone,
  calculateDistanceKm,
  calculateDeliveryFee,
  getDefaultDeliveryConfig,
  getDefaultDeliveryZones,
} from "@/lib/delivery";

/**
 * POST /api/delivery-fee
 * Public endpoint — calculates delivery fee based on customer coordinates and order total.
 * Body: { lat: number, lng: number, orderTotal: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, orderTotal = 0 } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "lat and lng are required as numbers" },
        { status: 400 }
      );
    }

    // Fetch delivery settings from DB (with defaults fallback)
    const [configRow, zonesRow] = await Promise.all([
      prisma.restaurantSetting.findUnique({ where: { key: "delivery_config" } }),
      prisma.restaurantSetting.findUnique({ where: { key: "delivery_zones" } }),
    ]);

    const config: DeliveryConfig = configRow
      ? (configRow.value as unknown as DeliveryConfig)
      : getDefaultDeliveryConfig();

    const zones: DeliveryZone[] = zonesRow
      ? (zonesRow.value as unknown as DeliveryZone[])
      : getDefaultDeliveryZones();

    // Calculate distance
    const distanceKm = calculateDistanceKm(
      config.cafeLocation.lat,
      config.cafeLocation.lng,
      lat,
      lng
    );

    // Calculate fee
    const result = calculateDeliveryFee(distanceKm, orderTotal, zones, config);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    return NextResponse.json(
      { error: "Failed to calculate delivery fee" },
      { status: 500 }
    );
  }
}
