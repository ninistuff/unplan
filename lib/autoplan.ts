// lib/autoplan.ts
import type { LatLng } from "react-native-maps";

export type Place = {
  id: string;
  name: string;
  coords: { latitude: number; longitude: number };
  rating?: number;      // 0–5
  openNow?: boolean;    // true/false
};

export type Plan = {
  from: LatLng;
  to: Place;
  routeCoords: LatLng[];
  distanceKm: number;
  durationMin: number;
};

// Distanță în km între două coordonate (Haversine)
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Scor simplu: apropiere + deschis + rating
export function scorePlace(p: Place, user: LatLng) {
  const dist = Math.max(haversineKm(user, p.coords), 0.2); // evită 0
  const nearScore = 1 / dist;                // mai aproape = mai bine
  const ratingScore = (p.rating ?? 3.8) - 3; // favorizează >3
  const openBoost = p.openNow ? 0.7 : -0.3;
  return nearScore * 1.2 + ratingScore * 0.6 + openBoost;
}

// Alege cea mai bună destinație din proximitate
export function pickBestDestination(places: Place[], user: LatLng): Place | null {
  const candidates = places.filter((p) => haversineKm(user, p.coords) <= 12); // ~12km
  if (!candidates.length) return null;
  return candidates.sort((a, b) => scorePlace(b, user) - scorePlace(a, user))[0];
}

// Cere ruta driving la OSRM (gratuit, fără cheie)
export async function fetchDrivingRouteOSRM(
  from: LatLng,
  to: LatLng
): Promise<{ coords: LatLng[]; distanceKm: number; durationMin: number }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("OSRM indisponibil momentan");
  const data = await r.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("Nicio rută găsită");

  const coords: LatLng[] = route.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon })
  );
  const distanceKm = Number((route.distance / 1000).toFixed(1));
  const durationMin = Math.round(route.duration / 60);
  return { coords, distanceKm, durationMin };
}

// Construiește planul: alege destinația + ia ruta
export async function buildPlan(user: LatLng, places: Place[]): Promise<Plan> {
  const dest = pickBestDestination(places, user) ?? places[0];
  if (!dest) throw new Error("Nu există destinații disponibile.");
  const r = await fetchDrivingRouteOSRM(user, dest.coords);
  return {
    from: user,
    to: dest,
    routeCoords: r.coords,
    distanceKm: r.distanceKm,
    durationMin: r.durationMin,
  };
}
