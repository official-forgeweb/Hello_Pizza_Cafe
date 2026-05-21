import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DeliveryConfig,
  DeliveryZone,
  getDefaultDeliveryConfig,
  getDefaultDeliveryZones,
} from "@/lib/delivery";

// GET — Fetch delivery settings
export async function GET() {
  try {
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

    return NextResponse.json({ config, zones });
  } catch (error) {
    console.error("Error fetching delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery settings" },
      { status: 500 }
    );
  }
}

// PUT — Update delivery settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, zones } = body as {
      config: DeliveryConfig;
      zones: DeliveryZone[];
    };

    // Validate config
    if (!config || !config.cafeLocation || typeof config.cafeLocation.lat !== "number") {
      return NextResponse.json(
        { error: "Invalid delivery config: cafeLocation with lat/lng required" },
        { status: 400 }
      );
    }

    if (config.maxDeliveryRadiusKm <= 0) {
      return NextResponse.json(
        { error: "Max delivery radius must be positive" },
        { status: 400 }
      );
    }

    // Validate zones
    if (!Array.isArray(zones) || zones.length === 0) {
      return NextResponse.json(
        { error: "At least one delivery zone is required" },
        { status: 400 }
      );
    }

    // Ensure zones are sorted by maxDistanceKm and no overlaps
    const sorted = [...zones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
    for (let i = 0; i < sorted.length; i++) {
      const z = sorted[i];
      if (z.maxDistanceKm <= 0 || z.deliveryFee < 0 || z.minOrderAmount < 0) {
        return NextResponse.json(
          { error: `Zone "${z.label}" has invalid values. Distance must be > 0, fees must be >= 0.` },
          { status: 400 }
        );
      }
      if (i > 0 && z.maxDistanceKm <= sorted[i - 1].maxDistanceKm) {
        return NextResponse.json(
          { error: `Zone "${z.label}" has a duplicate or non-ascending max distance.` },
          { status: 400 }
        );
      }
    }

    // Upsert both settings
    await Promise.all([
      prisma.restaurantSetting.upsert({
        where: { key: "delivery_config" },
        update: { value: config as any },
        create: { key: "delivery_config", value: config as any },
      }),
      prisma.restaurantSetting.upsert({
        where: { key: "delivery_zones" },
        update: { value: sorted as any },
        create: { key: "delivery_zones", value: sorted as any },
      }),
    ]);

    return NextResponse.json({ success: true, config, zones: sorted });
  } catch (error) {
    console.error("Error updating delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to update delivery settings" },
      { status: 500 }
    );
  }
}
