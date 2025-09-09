// utils/generatePlansReal.ts — Generator real (V1) cu Overpass + reguli de bază
import { locationService } from "../lib/locationService";
import type { GenerateOptions, Plan, LatLng } from "../lib/planTypes";
import { fetchPOIsAround, type OverpassCategory } from "./overpass";

// Haversine simplu (m)
function hav(a: LatLng, b: LatLng) {
  const R = 6371e3; const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat); const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat); const la2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Estimare timpi deplasare per mod (minute pentru distanța m)
function travelMinutes(meters: number, mode: Plan["mode"]) {
  if (mode === "foot") {
    const mps = 1.35; // ~4.8 km/h
    return Math.ceil(meters / (mps * 60));
  }
  if (mode === "bike") {
    const mps = 4.0; // ~14.4 km/h
    return Math.ceil(meters / (mps * 60));
  }
  // driving/public aproximează în oraș ~18 km/h cu semafoare etc.
  const mps = 5.0; // 18 km/h
  return Math.ceil(meters / (mps * 60));
}

function stopsByDuration(mins: number) {
  if (mins <= 120) return 1;
  if (mins <= 240) return 2;
  if (mins <= 360) return 3; // 2–3 -> alegem 3 când se potrivește, vom tăia la nevoie
  if (mins <= 480) return 4;
  if (mins <= 600) return 5;
  return 6;
}

// Durată implicită pe activitate (minute)
function defaultDuration(category: string): number {
  switch (category) {
    case "cinema": return 110;
    case "museum": return 45;
    case "park": return 40;
    case "bar": return 60;
    case "cafe": return 50;
    default: return 45;
  }
}

// Estimare cost (lei)
function estimatedCost(category: string): number | undefined {
  switch (category) {
    case "cinema": return 40;
    case "museum": return 30;
    case "bar": return 50;
    case "cafe": return 40;
    case "park": return 0;
    default: return undefined;
  }
}

// Simplu: preiau câteva semnale meteo orare (6h)
async function getWeatherFlags(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,apparent_temperature,windspeed_10m&forecast_days=1&timezone=auto`;
    const res = await fetch(url);
    const j = await res.json();
    const hourly = j?.hourly;
    const pp: number[] = hourly?.precipitation_probability || [];
    const appT: number[] = hourly?.apparent_temperature || [];
    const wind: number[] = hourly?.windspeed_10m || [];
    // primele 3 ore pentru ploaie
    const rainSoon = pp.slice(0, 3).some((p: number) => (p || 0) >= 50);
    const hot = appT.slice(0, 6).some((v: number) => (v || 0) >= 35);
    const windStrong = wind.slice(0, 6).some((v: number) => (v || 0) >= 40); // km/h aprox
    return { rainSoon, hot, windStrong };
  } catch {
    return { rainSoon: false, hot: false, windStrong: false };
  }
}

function modeFromTransport(t?: GenerateOptions["transport"]): Plan["mode"] {
  if (t === "bike") return "bike";
  if (t === "car") return "driving";
  return "foot";
}

function radiusFor(transport: GenerateOptions["transport"], duration: number): number {
  // în oraș, în funcție de mod + durată
  if (transport === "walk") return Math.min(3000, 800 + duration * 8);
  if (transport === "bike") return Math.min(8000, 1500 + duration * 15);
  if (transport === "public") return Math.min(12000, 2500 + duration * 20);
  if (transport === "car") return Math.min(15000, 3000 + duration * 20);
  return 3000;
}

function withinSegmentLimit(transport: GenerateOptions["transport"], meters: number) {
  if (transport === "walk") return meters <= 1500;
  if (transport === "bike") return meters <= 5000;
  if (transport === "public") return meters <= 12000;
  if (transport === "car") return meters <= 20000;
  return true;
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

export async function generatePlans(opts: GenerateOptions, signal?: AbortSignal): Promise<Plan[]> {
  if (signal?.aborted) return [];

  // 1) Locație curentă
  let center: LatLng = { lat: 44.4268, lon: 26.1025 }; // fallback: București
  try {
    const loc = await locationService.getCurrentLocation({ timeout: 8000, highAccuracy: true });
    center = { lat: loc.latitude, lon: loc.longitude };
  } catch {
    // folosim fallback
  }

  // 2) Semnale meteo rapide
  const wx = await getWeatherFlags(center.lat, center.lon);

  // 3) Overpass: POI-uri în jur
  const allowed: OverpassCategory[] = ["cafe", "bar", "cinema", "museum", "park"];
  const rad = radiusFor(opts.transport || "walk", opts.duration);
  let pois = [] as Awaited<ReturnType<typeof fetchPOIsAround>>;
  try {
    pois = await fetchPOIsAround(center, allowed, rad, 20, signal);
  } catch {}

  // Filtrări de bază: nume reale (parser face deja), distanță segmentată după transport
  // Vom grupa planurile în jurul unui prim POI (ancoră) pentru a respecta segmentele scurte

  // 4) Decide număr opriri + timp pe drum
  const desiredStops = stopsByDuration(opts.duration);
  const maxTravelShare = 0.30; // 25–35%: aleg vârf mediu
  const maxTravelMin = Math.floor(opts.duration * maxTravelShare);

  const mode = modeFromTransport(opts.transport);
  const transport = opts.transport || "walk";

  // 5) Heuristici categorie după "cu cine" și vreme
  const preferIndoor = wx.rainSoon || wx.hot;
  function pickCategories(): string[] {
    const who = opts.withWho || "friends";
    if (preferIndoor) {
      if (who === "family") return ["museum", "cafe", "cinema"];
      if (who === "partner") return ["cafe", "museum", "cinema"];
      if (who === "pet") return ["park", "cafe"]; // doar dacă evident pet-friendly, altfel evităm marcajul
      return ["cafe", "bar", "cinema"];
    } else {
      if (who === "family") return ["park", "museum", "cafe"];
      if (who === "partner") return ["cafe", "park", "museum"];
      if (who === "pet") return ["park", "cafe"];
      return ["park", "cafe", "bar"];
    }
  }

  // Ajutor: găsește un traseu cu N opriri care încape în timp și distanțe per segment
  function buildItinerary(anchor: LatLng, cats: string[]): { steps: { name: string; lat: number; lon: number; category: string }[]; travelMin: number; visitMin: number } | null {
    const results: { name: string; lat: number; lon: number; category: string }[] = [];
    let usedIds = new Set<string>();
    let travelMin = 0; let visitMin = 0;

    // alege un POI de start (prima oprire) cât mai aproape de anchor
    const byDist = pois
      .map(p => ({ p, d: hav(anchor, { lat: p.lat, lon: p.lon }) }))
      .sort((a,b) => a.d - b.d)
      .map(x => x.p);

    for (const cat of cats) {
      const candidate = byDist.find(p => p.category === (cat as any) && !usedIds.has(p.id));
      if (!candidate) continue;
      // travel time de la anchor sau de la ultimul
      const last = results.length ? results[results.length-1] : null;
      const from = last ? { lat: last.lat, lon: last.lon } : anchor;
      const dist = hav(from, { lat: candidate.lat, lon: candidate.lon });
      if (!withinSegmentLimit(transport, dist)) continue;
      const segMin = travelMinutes(dist, mode);
      const stopMin = defaultDuration(candidate.category);
      if (travelMin + segMin + visitMin + stopMin > opts.duration) break;
      travelMin += segMin; visitMin += stopMin;
      results.push({ name: candidate.name, lat: candidate.lat, lon: candidate.lon, category: candidate.category });
      usedIds.add(candidate.id);
      if (results.length >= desiredStops) break;
    }

    if (!results.length) return null;
    if (travelMin > maxTravelMin) {
      // taie din coadă până încape
      while (results.length > 1 && travelMin > maxTravelMin) {
        const removed = results.pop()!;
        // recalc travel aproximativ (înapoi)
        const prev = results.length ? results[results.length-1] : null;
        const from = prev ? { lat: prev.lat, lon: prev.lon } : anchor;
        const dist = hav(from, { lat: removed.lat, lon: removed.lon });
        travelMin -= travelMinutes(dist, mode);
        visitMin -= defaultDuration(removed.category);
      }
    }

    if (visitMin <= 0) return null;
    return { steps: results, travelMin, visitMin };
  }

  // 6) Construiește 3 planuri distincte
  const categories = pickCategories();
  const anchors = pick(pois, 5).map(p => ({ lat: p.lat, lon: p.lon }));
  const plans: Plan[] = [];

  for (let i = 0; i < 5 && plans.length < 3; i++) {
    const anchor = anchors[i] || center;
    const cats = categories.slice();
    // Reordonează pentru vreme: dacă plouă în 2h, pune eventual "park" primul și scurt, apoi indoor
    if (wx.rainSoon) {
      const idx = cats.indexOf("park");
      if (idx >= 0) { cats.splice(idx,1); cats.unshift("park"); }
    }
    const itin = buildItinerary(anchor, cats);
    if (!itin) continue;

    // calculează cost total
    let cost = 0; let costUnknown = false;
    for (const s of itin.steps) {
      const c = estimatedCost(s.category);
      if (typeof c === "number") cost += c; else costUnknown = true;
    }

    // buget: dacă depășește și nu e inf, taie din coadă
    const budget = (opts.budget == null ? Infinity : opts.budget);
    if (budget !== Infinity) {
      while (itin.steps.length > 1 && cost > budget) {
        const removed = itin.steps.pop()!;
        const c = estimatedCost(removed.category);
        if (typeof c === "number") cost -= c;
      }
    }

    const id = ["A","B","C"][plans.length] || String(plans.length);
    const title = plans.length === 0 ? ("Echilibrat") : plans.length === 1 ? ("Social") : ("Cultural");

    const routeSegments: Plan["routeSegments"] = [];

    const p: Plan = {
      id,
      title,
      steps: [ { kind: "start", name: "Start", coord: center }, ...itin.steps.map(s => ({ kind: "poi", name: s.name, coord: { lat: s.lat, lon: s.lon }, category: s.category as any })) ],
      mode,
      stops: itin.steps.map(s => ({ name: s.name, lat: s.lat, lon: s.lon })),
      km: Math.round((itin.travelMin * (mode === "foot" ? 0.08 : mode === "bike" ? 0.24 : 0.3)) * 10) / 10, // aproximativ
      min: Math.min(opts.duration, itin.travelMin + itin.visitMin),
      cost: (budget === Infinity ? (costUnknown ? undefined : cost) : Math.min(cost, budget)) as any,
      routeSegments,
    };

    plans.push(p);
  }

  // Dacă nu am destule planuri, livrează fallback minimalist
  if (plans.length < 3) {
    while (plans.length < 3) {
      plans.push({ id: String.fromCharCode(65 + plans.length), title: "Plan", steps: [{ kind: "start", name: "Start", coord: center }], mode, km: 0, min: Math.min(60, opts.duration) });
    }
  }

  return plans;
}

