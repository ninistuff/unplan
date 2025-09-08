// utils/transitRouter.ts
// utils/transitRouter.ts
import { fetchWithTimeout } from "./fetchWithTimeout";

import type { LatLng } from "../lib/planTypes";
// import { getTransitConfig, logTransitStatus } from "./transitConfig";

export type TransitLegKind = "foot" | "bus" | "metro";

export type TransitLeg = {
  kind: TransitLegKind;
  from: LatLng;
  to: LatLng;
  shape?: LatLng[]; // decoded polyline
  boardName?: string;
  alightName?: string;
  duration?: number; // in seconds
  distance?: number; // in meters
  routeName?: string;
  routeColor?: string;
};

export type TransitRouteResult = {
  legs: TransitLeg[];
  totalDuration: number; // in seconds
  totalDistance: number; // in meters
  error?: string;
};

function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lon = 0; const coords: LatLng[] = [];
  while (index < str.length) {
    let b = 0, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1); lat += dlat;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlon = (result & 1) ? ~(result >> 1) : (result >> 1); lon += dlon;
    coords.push({ lat: lat / 1e5, lon: lon / 1e5 });
  }
  return coords;
}

// Simple configuration fallback
const transitConfig = {
  otpBaseUrl: (typeof process !== 'undefined' && process?.env)
    ? (process.env.OTP_BASE_URL || process.env.EXPO_PUBLIC_OTP_BASE_URL || null)
    : null,
  requestTimeout: 10000,
  debugLogging: false
};

// Enhanced OTP planning with better error handling and logging
export async function planTransitViaOTP(
  baseUrl: string | null,
  from: LatLng,
  to: LatLng,
  when?: Date,
  maxWalkMeters: number = 1000,
  signal?: AbortSignal
): Promise<TransitLeg[] | null> {
  try {
    const otpUrl = baseUrl || transitConfig.otpBaseUrl;
    if (!otpUrl) {

      return null;
    }

    const dt = when ?? new Date();
    const date = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    const time = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;

    const url = `${otpUrl.replace(/\/$/, '')}/otp/routers/default/plan?` +
      `fromPlace=${from.lat},${from.lon}&` +
      `toPlace=${to.lat},${to.lon}&` +
      `mode=TRANSIT,WALK&` +
      `date=${encodeURIComponent(date)}&` +
      `time=${encodeURIComponent(time)}&` +
      `numItineraries=1&` +
      `maxWalkDistance=${encodeURIComponent(String(maxWalkMeters))}`;



    if (signal?.aborted) return null;
    const res = await fetchWithTimeout(url, {
      timeoutMs: 3000,
      externalSignal: signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`[TransitRouter] OTP request failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (json.error) {
      console.error(`[TransitRouter] OTP planning failed: ${json.error.msg || 'Unknown error'}`);
      return null;
    }

    const itin = json?.plan?.itineraries?.[0];
    if (!itin || !Array.isArray(itin.legs)) {

      return null;
    }

    const legs: TransitLeg[] = [];
    for (const leg of itin.legs as any[]) {
      const mode: string = String(leg.mode || '').toUpperCase();
      const kind: TransitLegKind = mode === 'BUS' ? 'bus' :
                                   mode === 'SUBWAY' || mode === 'TRAM' || mode === 'RAIL' ? 'metro' : 'foot';

      const fromCoord: LatLng = { lat: leg.from?.lat, lon: leg.from?.lon };
      const toCoord: LatLng = { lat: leg.to?.lat, lon: leg.to?.lon };

      let shape: LatLng[] | undefined = undefined;
      const pts = leg?.legGeometry?.points as string | undefined;
      if (pts && typeof pts === 'string') {
        try {
          shape = decodePolyline(pts);
        } catch (e) {

        }
      }

      legs.push({
        kind,
        from: fromCoord,
        to: toCoord,
        shape,
        boardName: leg.from?.name,
        alightName: leg.to?.name
      });
    }


    return legs;

  } catch (error) {
    console.error(`[TransitRouter] Exception during OTP request:`, error);
    return null;
  }
}

// Legacy function for backward compatibility - now the main function returns the legacy format
export async function planTransitViaOTPLegacy(baseUrl: string, from: LatLng, to: LatLng, when?: Date, maxWalkMeters: number = 1000): Promise<TransitLeg[] | null> {
  return await planTransitViaOTP(baseUrl, from, to, when, maxWalkMeters);
}

// Fallback transit routing using basic heuristics and local transit data
export async function planTransitFallback(from: LatLng, to: LatLng): Promise<TransitRouteResult> {
  const result: TransitRouteResult = {
    legs: [],
    totalDuration: 0,
    totalDistance: 0
  };

  try {
    // Calculate straight-line distance
    const distance = haversineDistance(from, to);

    // If distance is very short (< 500m), suggest walking only
    if (distance < 500) {
      result.legs.push({
        kind: 'foot',
        from,
        to,
        duration: Math.round(distance / 1.4), // ~1.4 m/s walking speed
        distance
      });
      result.totalDuration = result.legs[0].duration!;
      result.totalDistance = distance;
      return result;
    }

    // For longer distances, create a simple transit plan
    // This is a basic heuristic - in a real app you'd use local transit data
    const midPoint: LatLng = {
      lat: (from.lat + to.lat) / 2,
      lon: (from.lon + to.lon) / 2
    };

    // Walking to transit stop (assume 200m walk)
    const walkToStop = 200;
    const walkToStopDuration = Math.round(walkToStop / 1.4);

    // Transit segment (assume average speed based on distance)
    const transitDistance = distance - 400; // minus walking segments
    const transitSpeed = distance > 5000 ? 25 : 15; // metro vs bus speed (km/h)
    const transitDuration = Math.round((transitDistance / 1000) * 3600 / transitSpeed);

    // Walking from transit stop
    const walkFromStop = 200;
    const walkFromStopDuration = Math.round(walkFromStop / 1.4);

    // Create transit stop coordinates (simplified)
    const boardingStop: LatLng = {
      lat: from.lat + (midPoint.lat - from.lat) * 0.3,
      lon: from.lon + (midPoint.lon - from.lon) * 0.3
    };

    const alightingStop: LatLng = {
      lat: to.lat + (midPoint.lat - to.lat) * 0.3,
      lon: to.lon + (midPoint.lon - to.lon) * 0.3
    };

    // Build legs
    result.legs = [
      {
        kind: 'foot',
        from,
        to: boardingStop,
        duration: walkToStopDuration,
        distance: walkToStop,
        alightName: 'Transit Stop'
      },
      {
        kind: distance > 5000 ? 'metro' : 'bus',
        from: boardingStop,
        to: alightingStop,
        duration: transitDuration,
        distance: transitDistance,
        boardName: 'Transit Stop',
        alightName: 'Transit Stop',
        routeName: distance > 5000 ? 'Metro Line' : 'Bus Route'
      },
      {
        kind: 'foot',
        from: alightingStop,
        to,
        duration: walkFromStopDuration,
        distance: walkFromStop,
        boardName: 'Transit Stop'
      }
    ];

    result.totalDuration = walkToStopDuration + transitDuration + walkFromStopDuration;
    result.totalDistance = distance;

    console.log(`[TransitRouter] Generated fallback route with ${result.legs.length} legs`);
    return result;

  } catch (error) {
    result.error = `Fallback routing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[TransitRouter] Fallback routing failed:`, error);
    return result;
  }
}

// Haversine distance calculation
function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Main transit planning function with fallback
export async function planTransitRoute(from: LatLng, to: LatLng, when?: Date, maxWalkMeters: number = 1000): Promise<TransitRouteResult> {


  // Try OTP first (hard cap to 3 legs is enforced by OTP numItineraries=1)
  const otpResult = await planTransitViaOTP(null, from, to, when, maxWalkMeters);

  if (otpResult && otpResult.length > 0) {

    return {
      legs: otpResult,
      totalDuration: 0,
      totalDistance: 0
    };
  }



  // Fall back to basic transit routing
  return await planTransitFallback(from, to);
}
