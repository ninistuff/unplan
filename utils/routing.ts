// utils/routing.ts
import { LatLng } from "../lib/planTypes";

const OSRM_BASE = "https://router.project-osrm.org";

export async function osrmRoute(
  coords: LatLng[],
  mode: "foot" | "bike" | "driving" = "foot"
) {
  if (!coords || coords.length < 2) {
    throw new Error("Ai nevoie de cel puțin 2 puncte (start și destinație).");
  }

  const profile = mode === "driving" ? "driving" : mode === "bike" ? "cycling" : "foot";
  const path = coords.map((c) => `${c.lon},${c.lat}`).join(";");
  const url = `${OSRM_BASE}/route/v1/${profile}/${path}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);
  const json = await res.json();
  const route = json?.routes?.[0];
  if (!route) throw new Error("OSRM nu a întors nicio rută.");

  return {
    distanceMeters: route.distance as number,
    durationSeconds: route.duration as number,
    geometry: route.geometry as { type: "LineString"; coordinates: [number, number][] },
  };
}

