/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";
import {
  DeliveryConfig,
  DeliveryZone,
  getDefaultDeliveryConfig,
  getDefaultDeliveryZones,
} from "@/lib/delivery";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface SettingsCache {
  delivery_config?: CacheEntry<DeliveryConfig>;
  delivery_zones?: CacheEntry<DeliveryZone[]>;
  configPromise?: Promise<DeliveryConfig>;
  zonesPromise?: Promise<DeliveryZone[]>;
}

// Persist the cache across hot-reloading in development mode
const globalCache: SettingsCache = (globalThis as any).settingsCache || {};

if (!(globalThis as any).settingsCache) {
  (globalThis as any).settingsCache = globalCache;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Retrieves the cached delivery configuration. If the cache is expired or missing,
 * fetches from the database and updates the cache. Handles concurrent requests gracefully.
 */
export async function getCachedDeliveryConfig(): Promise<DeliveryConfig> {
  const now = Date.now();
  if (
    globalCache.delivery_config &&
    now - globalCache.delivery_config.timestamp < CACHE_TTL_MS
  ) {
    return globalCache.delivery_config.value;
  }

  if (globalCache.configPromise) {
    return globalCache.configPromise;
  }

  globalCache.configPromise = (async () => {
    try {
      const configRow = await prisma.restaurantSetting.findUnique({
        where: { key: "delivery_config" },
      });
      const config = configRow
        ? (configRow.value as unknown as DeliveryConfig)
        : getDefaultDeliveryConfig();
      globalCache.delivery_config = { value: config, timestamp: Date.now() };
      return config;
    } finally {
      globalCache.configPromise = undefined;
    }
  })();

  return globalCache.configPromise;
}

/**
 * Retrieves cached delivery zones. If the cache is expired or missing,
 * fetches from the database and updates the cache. Handles concurrent requests gracefully.
 */
export async function getCachedDeliveryZones(): Promise<DeliveryZone[]> {
  const now = Date.now();
  if (
    globalCache.delivery_zones &&
    now - globalCache.delivery_zones.timestamp < CACHE_TTL_MS
  ) {
    return globalCache.delivery_zones.value;
  }

  if (globalCache.zonesPromise) {
    return globalCache.zonesPromise;
  }

  globalCache.zonesPromise = (async () => {
    try {
      const zonesRow = await prisma.restaurantSetting.findUnique({
        where: { key: "delivery_zones" },
      });
      const zones = zonesRow
        ? (zonesRow.value as unknown as DeliveryZone[])
        : getDefaultDeliveryZones();
      globalCache.delivery_zones = { value: zones, timestamp: Date.now() };
      return zones;
    } finally {
      globalCache.zonesPromise = undefined;
    }
  })();

  return globalCache.zonesPromise;
}

/**
 * Invalidates the cached configurations. Must be called when settings are updated.
 */
export function clearSettingsCache(): void {
  globalCache.delivery_config = undefined;
  globalCache.delivery_zones = undefined;
}
