// Tipuri Overpass
// utils/overpass.ts
import type { POI } from "../lib/planTypes"
import { fetchWithTimeout } from "./fetchWithTimeout"

export type OverpassElementType = 'node' | 'way' | 'relation'

export interface OverpassCenter {
  lat: number
  lon: number
}

export interface OverpassElement {
  type: OverpassElementType
  id: number
  lat?: number
  lon?: number
  center?: OverpassCenter
  tags?: Record<string, string>
  nodes?: number[]
  geometry?: { lat: number; lon: number }[]
}

export interface OverpassResponse {
  elements: OverpassElement[]
}

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
] as const;

export type OverpassCategory =
  | "cafe" | "restaurant" | "fast_food" | "tea_room"
  | "bar" | "pub"
  | "cinema" | "library" | "museum" | "gallery"
  | "zoo" | "aquarium" | "attraction"
  | "fitness_centre" | "sports_centre" | "bowling_alley" | "escape_game" | "swimming_pool" | "climbing_indoor"
  | "arcade" | "karaoke" | "spa"
  | "park";

const tagMap: Record<OverpassCategory, string[]> = {
  cafe: ['amenity="cafe"'],
  restaurant: ['amenity="restaurant"'],
  fast_food: ['amenity="fast_food"'],
  tea_room: ['amenity="tearoom"', 'amenity="tea_room"'],
  bar: ['amenity="bar"'],
  pub: ['amenity="pub"'],
  cinema: ['amenity="cinema"'],
  library: ['amenity="library"'],
  museum: ['tourism="museum"'],
  gallery: ['tourism="gallery"'],
  zoo: ['tourism="zoo"'],
  aquarium: ['tourism="aquarium"'],
  attraction: ['tourism="attraction"'],
  fitness_centre: ['leisure="fitness_centre"'],
  sports_centre: ['leisure="sports_centre"'],
  bowling_alley: ['leisure="bowling_alley"'],
  escape_game: ['leisure="escape_game"'],
  swimming_pool: ['leisure="swimming_pool"'],
  climbing_indoor: ['leisure="climbing"', 'sport="climbing"'],
  arcade: ['leisure="amusement_arcade"', 'amenity="arcade"'],
  karaoke: ['amenity="karaoke"'],
  spa: ['leisure="spa"', 'amenity="spa"'],
  park: ['leisure="park"'],
};

function bboxFromCenter(lat: number, lon: number, radiusMeters = 1200) {
  const dLat = radiusMeters / 111320;
  const dLon = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return { s: lat - dLat, w: lon - dLon, n: lat + dLat, e: lon + dLon };
}
function nameValid(name: any): boolean {
  if (typeof name !== "string") return false;
  const n = name.trim();
  if (n.length < 3) return false;
  if (/^unnamed/i.test(n)) return false;
  return true;
}

function isExcludedGeneric(tags: any): boolean {
  const landuse = tags?.landuse;
  if (["cemetery", "grass", "meadow", "greenfield", "construction", "industrial", "farmland"].includes(landuse)) return true;
  if (tags?.amenity === "grave_yard") return true;
  return false;
}

function parseOpeningHoursSimple(opening_hours: string | undefined, now = new Date()): "open" | "closed" | "unknown" {
  if (!opening_hours || typeof opening_hours !== "string") return "unknown";
  const txt = opening_hours.trim();
  if (txt === "24/7") return "open";
  // Mo-Su 08:00-22:00 (ignores breaks); also accept 09:00-21:00
  const m = txt.match(/^(Mo-Su)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (m) {
    const sh = parseInt(m[2], 10), sm = parseInt(m[3], 10);
    const eh = parseInt(m[4], 10), em = parseInt(m[5], 10);
    const minutes = now.getHours() * 60 + now.getMinutes();
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end > start) return minutes >= start && minutes <= end ? "open" : "closed";
    // overnight window (rare for these categories)
    return minutes >= start || minutes <= end ? "open" : "closed";
  }
  return "unknown";
}


async function callOverpass(body: string, externalSignal?: AbortSignal) {
  let lastErr: any;
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (externalSignal?.aborted) throw new Error('aborted');
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body,
          timeoutMs: 3000,
          externalSignal,
        });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const data: OverpassResponse = await res.json() 
        return data
      } catch (e) {
        lastErr = e;
        if (externalSignal?.aborted) throw e;
        await new Promise((r) => setTimeout(r, attempt === 0 ? 150 : 300));
      }
    }
  }
  // timeout overpass (silenced to reduce console noise)
  throw lastErr || new Error("Overpass indisponibil");
}

function parseElements(elements: any[]): POI[] {
  const now = new Date();
  const pois: POI[] = elements
    .map((el) => {
      const lat = el.type === "node" ? el.lat : el.center?.lat;
      const lon = el.type === "node" ? el.lon : el.center?.lon;
      if (lat == null || lon == null) return null;

      const tags = el.tags || {};
      const name = tags.name || tags["name:ro"];
      if (!nameValid(name)) return null;
      if (isExcludedGeneric(tags)) return null;

      const category = ((): POI["category"] | null => {
        if (tags.amenity === "cafe") return "cafe";
        if (tags.amenity === "restaurant") return "restaurant";
        if (tags.amenity === "fast_food") return "fast_food";
        if (tags.amenity === "tearoom" || tags.amenity === "tea_room") return "tea_room";
        if (tags.amenity === "bar") return "bar";
        if (tags.amenity === "pub") return "pub";
        if (tags.amenity === "cinema") return "cinema";
        if (tags.amenity === "library") return "library";
        if (tags.amenity === "karaoke") return "karaoke";
        if (tags.amenity === "spa") return "spa";
        if (tags.leisure === "fitness_centre") return "fitness_centre";
        if (tags.leisure === "sports_centre") return "sports_centre";
        if (tags.leisure === "bowling_alley") return "bowling_alley";
        if (tags.leisure === "escape_game") return "escape_game";
        if (tags.leisure === "swimming_pool") return "swimming_pool";
        if (tags.leisure === "climbing" || tags.sport === "climbing") return "climbing_indoor";
        if (tags.leisure === "amusement_arcade" || tags.amenity === "arcade") return "arcade";
        if (tags.leisure === "spa") return "spa";
        if (tags.tourism === "museum") return "museum";
        if (tags.tourism === "gallery") return "gallery";
        if (tags.tourism === "zoo") return "zoo";
        if (tags.tourism === "aquarium") return "aquarium";
        if (tags.tourism === "attraction") return "attraction";
        if (tags.leisure === "park") return "park";
        return null;
      })();
      if (!category) return null;

      // optional image url from tags
      let imageUrl: string | undefined;
      const tagImage = tags.image || tags["image:0"];
      const commons = tags.wikimedia_commons;
      if (typeof tagImage === "string" && /^https?:\/\//i.test(tagImage)) {
        imageUrl = tagImage;
      } else if (typeof commons === "string" && commons.length > 0) {
        const title = encodeURIComponent(String(commons).replace(/^File:/i, ""));
        imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${title}`;
      }

      const openStatus = parseOpeningHoursSimple(tags.opening_hours, now);

      return {
        id: String(el.id),
        name,
        lat,
        lon,
        category,
        imageUrl,
        openStatus,
        address: tags["addr:street"]
          ? `${tags["addr:street"]} ${tags["addr:housenumber"] || ""}`.trim()
          : undefined,
      } as POI;
    })
    .filter(Boolean) as POI[];

  const seen = new Set<string>();
  return pois.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export async function fetchPOIsAround(
  center: { lat: number; lon: number },
  cats: OverpassCategory[],
  radiusMeters = 1200,
  limitPerCat = 15,
  signal?: AbortSignal,
  stats?: { raw: number; filtered: number }
): Promise<POI[]> {
  const bb = bboxFromCenter(center.lat, center.lon, radiusMeters);
  const bbox = `${bb.s},${bb.w},${bb.n},${bb.e}`;

  const all: POI[] = [];
  for (const cat of cats) {
    if (signal?.aborted) break;
    const tags = tagMap[cat].map((t) => `nwr[${t}](${bbox});`).join("");
    const ql = `[out:json][timeout:20];(${tags});out center ${limitPerCat};`;
    try {
      const json = await callOverpass(ql, signal);
      const elements = Array.isArray(json?.elements) ? json.elements : [];
      const parsed = parseElements(elements);
      if (stats) { stats.raw += elements.length; stats.filtered += parsed.length; }
      all.push(...parsed);
    } catch { } {
      // skip a failing category; keep others
    }
  }

  all.sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Set<string>();
  return all.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// Query POIs inside the administrative area (city) that contains the given point
export async function fetchPOIsInCity(
  center: { lat: number; lon: number },
  cats: OverpassCategory[],
  limitPerCat = 25,
  signal?: AbortSignal,
  stats?: { raw: number; filtered: number }
): Promise<POI[]> {
  const all: POI[] = [];
  for (const cat of cats) {
    if (signal?.aborted) break;
    const tagFilters = tagMap[cat].map((t) => `nwr[${t}](area.city);`).join("");
    // is_in(lat,lon)->.a creates a set of areas; then we filter to admin boundaries level 8/9
    const ql = `
[out:json][timeout:25];
is_in(${center.lat},${center.lon})->.a;
area.a[boundary="administrative"][admin_level~"^(8|9)$"]->.city;
(${tagFilters});
out center ${limitPerCat};`;
    try {
      const json = await callOverpass(ql, signal);
      const elements = Array.isArray(json?.elements) ? json.elements : [];
      const parsed = parseElements(elements);
      if (stats) { stats.raw += elements.length; stats.filtered += parsed.length; }
      all.push(...parsed);
    } catch { } {
      // fall back per-category: use around bbox if city lookup fails for this category
      try {
        const fallback = await fetchPOIsAround(center, [cat], 3000, limitPerCat, signal, stats);
        all.push(...fallback);
      } catch {}
    }
  }

  all.sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Set<string>();
  return all.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export type TransitStop = { id: string; name: string; lat: number; lon: number; mode: "bus" | "metro" };

export async function fetchTransitStopsAround(
  center: { lat: number; lon: number },
  radiusMeters = 2000,
  limitPerMode = 20,
  signal?: AbortSignal
): Promise<TransitStop[]> {
  const bb = bboxFromCenter(center.lat, center.lon, radiusMeters);
  const bbox = `${bb.s},${bb.w},${bb.n},${bb.e}`;
  const queries = [
    { mode: "bus" as const, q: `nwr[highway="bus_stop"](${bbox});` },
    { mode: "metro" as const, q: `nwr[railway="station"][station="subway"](${bbox});nwr[railway="subway_entrance"](${bbox});` },
  ];
  const out: TransitStop[] = [];
  for (const { mode, q } of queries) {
    const ql = `[out:json][timeout:20];(${q});out center ${limitPerMode};`;
    try {
      const json = await callOverpass(ql, signal);
      const elems = json.elements || [];
      for (const el of elems) {
        const lat = el.type === "node" ? el.lat : el.center?.lat;
        const lon = el.type === "node" ? el.lon : el.center?.lon;
        if (lat == null || lon == null) continue;
        const name = el.tags?.name || el.tags?.["name:ro"] || (mode === "bus" ? "Stație bus" : "Metrou");
        out.push({ id: String(el.id), name, lat, lon, mode });
      }
    } catch {}
  }
  // dedupe by id
  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

// Fetch route geometry (as polylines) for transit starting from a given stop id.
export async function fetchTransitShapesFromStop(
  stopId: string,
  kind: "bus" | "metro",
  dest: { lat: number; lon: number }
): Promise<{
  shapes: { lat: number; lon: number }[][];
  alightStop?: { id: string; lat: number; lon: number; name?: string };
} | null> {
  try {
    const routeFilter = kind === "metro" ? "subway|light_rail|train" : "bus";
    const q1 =
      `[out:json][timeout:25];` +
      `node(${stopId})->.s;` +
      `rel(bn.s)["type"="route"]["route"~"^(${routeFilter})$"];` +
      `out ids tags;`;
    const j1 = await callOverpass(q1);
    const rels = (j1?.elements || []).filter((e: any) => e.type === "relation");
    if (!rels.length) return null;
    const consider = rels.slice(0, Math.min(3, rels.length));
    let best: any = null;
    let bestD = Infinity;
    let bestWays: any[] | null = null;
    const hav = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
      const R = 6371000;
      const toRad = (x: number) => (x * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const la1 = toRad(a.lat);
      const la2 = toRad(b.lat);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    for (const rel of consider) {
      const rid = rel.id;
      const q2 = `[out:json][timeout:25];rel(${rid})->.r;way(r.r);out geom;`;
      const j2 = await callOverpass(q2);
      const ways = (j2?.elements || []).filter((e: any) => e.type === "way" && e.geometry);
      if (!ways.length) continue;
      let md = Infinity;
      for (const w of ways) {
        const g = w.geometry as { lat: number; lon: number }[];
        for (const pt of g) {
          const d = hav(dest, pt);
          if (d < md) md = d;
        }
      }
      if (md < bestD) {
        bestD = md;
        best = rid;
        bestWays = ways;
      }
    }
    if (!bestWays) return null;
    const shapes = bestWays.map((w) => (w.geometry as { lat: number; lon: number }[]).slice());

    // Try to find an official stop node (alighting) along this relation closest to dest
    let alightStop: { id: string; lat: number; lon: number; name?: string } | undefined;
    try {
      const stopFilter =
        kind === "bus"
          ? "[highway=\"bus_stop\"]"
          : "[railway=\"subway_entrance\"]|[station=\"subway\"]|[public_transport=\"stop_position\"]|[public_transport=\"platform\"]";
      const qStops = `[out:json][timeout:25];rel(${best})->.r;node(r.r)${stopFilter};out body;`;
      const jS = await callOverpass(qStops);
      const nodes = (jS?.elements || []).filter((e: any) => e.type === "node");
      if (nodes.length > 0) {
        let bestNode: any = null;
        let bd = Infinity;
        for (const n of nodes) {
          if (n.lat == null || n.lon == null) continue
          const d = hav(dest, { lat: n.lat, lon: n.lon });
          if (d < bd) {
            bd = d;
            bestNode = n;
          }
        }
        if (bestNode) alightStop = { id: String(bestNode.id), lat: bestNode.lat, lon: bestNode.lon, name: bestNode.tags?.name };
      }
    } catch {}

    return { shapes, alightStop };
  } catch {
    return null;
  }
}
