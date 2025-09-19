// lib/distance.ts
// Distance calculation utilities with caching for performance optimization

import { useRef, useMemo } from "react";

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Create a cache key from coordinates rounded to 5 decimal places
 * This provides ~1 meter precision which is sufficient for POI distance calculations
 */
function createCacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const roundedLat1 = Math.round(lat1 * 100000) / 100000;
  const roundedLon1 = Math.round(lon1 * 100000) / 100000;
  const roundedLat2 = Math.round(lat2 * 100000) / 100000;
  const roundedLon2 = Math.round(lon2 * 100000) / 100000;
  return `${roundedLat1},${roundedLon1}-${roundedLat2},${roundedLon2}`;
}

/**
 * Hook for cached distance calculations
 * Maintains a cache of distance calculations to avoid repeated Haversine computations
 */
export function useDistanceCache() {
  const cacheRef = useRef<Map<string, number>>(new Map());

  const calculateDistance = useMemo(
    () =>
      (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const cacheKey = createCacheKey(lat1, lon1, lat2, lon2);

        // Check cache first
        const cached = cacheRef.current.get(cacheKey);
        if (cached !== undefined) {
          return cached;
        }

        // Calculate and cache the result
        const distance = haversineKm(lat1, lon1, lat2, lon2);
        cacheRef.current.set(cacheKey, distance);

        // Prevent cache from growing too large (keep last 1000 calculations)
        if (cacheRef.current.size > 1000) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey !== undefined) {
            cacheRef.current.delete(firstKey);
          }
        }

        return distance;
      },
    [],
  );

  const clearCache = useMemo(
    () => () => {
      cacheRef.current.clear();
    },
    [],
  );

  return { calculateDistance, clearCache };
}

/**
 * Standalone cached distance calculator for use outside React components
 */
class DistanceCache {
  private cache = new Map<string, number>();
  private hits = 0;
  private misses = 0;

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const cacheKey = createCacheKey(lat1, lon1, lat2, lon2);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.hits++;
      return this.cache.get(cacheKey)!;
    }

    // Calculate and cache the result
    const distance = haversineKm(lat1, lon1, lat2, lon2);
    this.misses++;
    this.cache.set(cacheKey, distance);

    // Prevent cache from growing too large
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    return distance;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total ? this.hits / total : 0;
    return { hits: this.hits, misses: this.misses, hitRate, cacheSize: this.cache.size };
  }
}

// Global instance for use in non-React contexts
export const globalDistanceCache = new DistanceCache();
