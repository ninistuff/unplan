// utils/generatePlansReal.ts — Generator real (V1) cu Overpass + reguli de bază
import { locationService } from "../lib/locationService";
import type { GenerateOptions, LatLng, Plan, POI } from "../lib/planTypes";
import { fetchPOIsAround, fetchPOIsInCity, type OverpassCategory } from "./overpass";
import { getSearchRadiusKm } from "./planRadius";

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

// Durată implicită pe activitate (minute) - redusă pentru 2h
function defaultDuration(category: string): number {
  switch (category) {
    case "cinema": return 90; // redus de la 110
    case "museum": return 35; // redus de la 45
    case "park": return 30; // redus de la 40
    case "bar": return 45; // redus de la 60
    case "cafe": return 35; // redus de la 50
    case "restaurant": return 40;
    default: return 35; // redus de la 45
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
  // folosește noul utilitar pentru rază dinamică
  const transportType = transport === "walk" ? "walk" :
                       transport === "bike" ? "bike" :
                       transport === "public" ? "public" :
                       transport === "car" ? "car" : "walk";

  const radiusKm = getSearchRadiusKm(duration, transportType);
  return Math.round(radiusKm * 1000); // convertește la metri
}

function withinSegmentLimit(transport: GenerateOptions["transport"], meters: number) {
  // relaxat pentru 2h pe jos - permitem segmente mai lungi
  if (transport === "walk") return meters <= 2500; // mărit de la 1500
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

  console.log('[Generator] 🚀 Starting with options:', opts);

  // Test special pentru debugging - parametrii specificați
  if (opts.duration === 120 && opts.transport === 'walk' && opts.withWho === 'friends' && opts.budget === 200) {
    console.log('[Generator] 🔍 DEBUGGING MODE: 2h, walk, friends, 200 lei');
  }

  // 1) Locație curentă (preferă coordonate primite din Home)
  let center: LatLng = opts.center || { lat: 44.4268, lon: 26.1025 }; // fallback: București
  if (!opts.center) {
    try {
      const loc = await locationService.getCurrentLocation({ timeout: 8000, highAccuracy: true });
      center = { lat: loc.latitude, lon: loc.longitude };
    } catch {
      // folosim fallback
    }
  }

  // 2) Semnale meteo rapide
  const wx = await getWeatherFlags(center.lat, center.lon);

  // 3) Overpass: POI-uri în jur cu fallback progresiv + statistici
  const allowed: OverpassCategory[] = [
    "cafe","restaurant","fast_food","tea_room","bar","pub",
    "cinema","library","museum","gallery","zoo","aquarium","attraction",
    "fitness_centre","sports_centre","bowling_alley","escape_game","swimming_pool","climbing_indoor",
    "arcade","karaoke","spa","park"
  ];

  const initialRad = radiusFor(opts.transport || "walk", opts.duration);
  const radiusAttempts = [initialRad, Math.round(initialRad * 1.5), Math.round(initialRad * 2), 12000];
  let requireOpen = true;
  let selectedPois: POI[] = [];
  let statsSummary = { raw: 0, filtered: 0, afterWho: 0, radius: initialRad, requireOpen };

  const categoriesWanted = ["cafe","restaurant","bar","park","cinema"]

  for (let attempt = 0; attempt < radiusAttempts.length; attempt++) {
    if (signal?.aborted) return [];
    const rad = radiusAttempts[attempt];
    const stats = { raw: 0, filtered: 0 };
    let pois: POI[] = [];
    try {
      pois = await fetchPOIsAround(center, allowed, rad, 20, signal, stats);
    } catch {
      // fallback la tot orașul dacă around eșuează
      try {
        pois = await fetchPOIsInCity(center, allowed, 20, signal, stats);
      } catch {}
    }

    const afterOpen = requireOpen ? pois.filter(p => p.openStatus !== 'closed') : pois;
    const afterWho = afterOpen.filter(p => categoriesWanted.includes(p.category as any));

    statsSummary = { raw: stats.raw, filtered: afterOpen.length, afterWho: afterWho.length, radius: rad, requireOpen } as any;

    if (afterWho.length > 0) {
      selectedPois = afterWho;
      break;
    }

    // relaxare: după 2 încercări, renunțăm la filtrarea după openStatus
    if (attempt === 1) requireOpen = false;
  }

  // Logging cerut: 3 numere + 3 POI din zonă
  try {
    const nearest = selectedPois
      .map(p => ({ p, d: hav(center, { lat: p.lat, lon: p.lon }) }))
      .sort((a,b)=>a.d-b.d)
      .slice(0,3)
      .map(x => x.p.name);
    console.log('[Generator] Overpass stats', { center, ...statsSummary });
    console.log('[Generator] Sample POIs:', nearest);
  console.log('[Generator] Selected POIs count:', selectedPois.length);
  } catch {}

  // Filtrări de bază: nume reale (parser face deja), distanță segmentată după transport
  // Vom grupa planurile în jurul unui prim POI (ancoră) pentru a respecta segmentele scurte

  // 4) Decide număr opriri + timp pe drum - relaxat pentru 2h
  const desiredStops = Math.max(1, stopsByDuration(opts.duration)); // minim 1 oprire
  const maxTravelShare = opts.duration <= 150 ? 0.40 : 0.30; // mai mult timp pe drum pentru durate scurte
  const maxTravelMin = Math.floor(opts.duration * maxTravelShare);

  const mode = modeFromTransport(opts.transport);
  const transport = opts.transport || "walk";

  console.log('[Generator] Config: desired stops:', desiredStops, 'max travel:', maxTravelMin, 'min, transport:', transport);

  // 5) Heuristici categorie după "cu cine" și vreme — deja determinate în categoriesWanted
  function pickCategories(): string[] {
    return categoriesWanted.slice();
  }

  // Ajutor: găsește un traseu cu N opriri care încape în timp și distanțe per segment
  function buildItinerary(anchor: LatLng, cats: string[]): { steps: { name: string; lat: number; lon: number; category: string }[]; travelMin: number; visitMin: number } | null {
    const results: { name: string; lat: number; lon: number; category: string }[] = [];
    let usedIds = new Set<string>();
    let travelMin = 0; let visitMin = 0;

    console.log(`[Itinerary] Building for ${opts.duration}min, transport: ${transport}, maxTravel: ${maxTravelMin}min`);

    // alege un POI de start (prima oprire) cât mai aproape de anchor
    const byDist = selectedPois
      .map(p => ({ p, d: hav(anchor, { lat: p.lat, lon: p.lon }) }))
      .sort((a,b) => a.d - b.d)
      .map(x => x.p);

    console.log(`[Itinerary] Available POIs: ${byDist.length}, categories wanted: ${cats.join(',')}`);

    for (const cat of cats) {
      const candidate = byDist.find(p => p.category === (cat as any) && !usedIds.has(p.id));
      if (!candidate) {
        console.log(`[Itinerary] ❌ No candidate for category: ${cat}`);
        continue;
      }

      // travel time de la anchor sau de la ultimul
      const last = results.length ? results[results.length-1] : null;
      const from = last ? { lat: last.lat, lon: last.lon } : anchor;
      const dist = hav(from, { lat: candidate.lat, lon: candidate.lon });
      const segMin = travelMinutes(dist, mode);
      const stopMin = defaultDuration(candidate.category);
      const newTotalTravel = travelMin + segMin;
      const newTotalTime = newTotalTravel + visitMin + stopMin;

      console.log(`[Itinerary] Checking ${candidate.name} (${cat}): dist=${Math.round(dist)}m, segMin=${segMin}, stopMin=${stopMin}, totalTime=${newTotalTime}/${opts.duration}`);

      if (!withinSegmentLimit(transport, dist)) {
        console.log(`[Itinerary] ❌ ${candidate.name}: segment too long (${Math.round(dist)}m > limit)`);
        continue;
      }

      if (newTotalTime > opts.duration) {
        console.log(`[Itinerary] ❌ ${candidate.name}: total time exceeds duration (${newTotalTime} > ${opts.duration})`);
        break;
      }

      travelMin += segMin; visitMin += stopMin;
      results.push({ name: candidate.name, lat: candidate.lat, lon: candidate.lon, category: candidate.category });
      usedIds.add(candidate.id);
      console.log(`[Itinerary] ✅ Added ${candidate.name}: travel=${travelMin}min, visit=${visitMin}min`);

      if (results.length >= desiredStops) break;
    }

    console.log(`[Itinerary] Built ${results.length} stops, travel: ${travelMin}min, visit: ${visitMin}min`);

    if (!results.length) {
      console.log(`[Itinerary] ❌ No valid stops found`);
      return null;
    }

    if (travelMin > maxTravelMin) {
      console.log(`[Itinerary] ⚠️ Travel time ${travelMin} > ${maxTravelMin}, trimming...`);
      // taie din coadă până încape
      while (results.length > 1 && travelMin > maxTravelMin) {
        const removed = results.pop()!;
        // recalc travel aproximativ (înapoi)
        const prev = results.length ? results[results.length-1] : null;
        const from = prev ? { lat: prev.lat, lon: prev.lon } : anchor;
        const dist = hav(from, { lat: removed.lat, lon: removed.lon });
        travelMin -= travelMinutes(dist, mode);
        visitMin -= defaultDuration(removed.category);
        console.log(`[Itinerary] Removed ${removed.name}, new travel: ${travelMin}min`);
      }
    }

    if (visitMin <= 0) {
      console.log(`[Itinerary] ❌ No visit time left`);
      return null;
    }

    console.log(`[Itinerary] ✅ Final: ${results.length} stops, ${travelMin}min travel, ${visitMin}min visit`);
    return { steps: results, travelMin, visitMin };
  }

  // 6) Construiește 3 planuri distincte
  const categories = pickCategories();
  const anchors = pick(selectedPois, 5).map(p => ({ lat: p.lat, lon: p.lon }));
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

    const mode = opts.transport === "walk" ? "foot" : opts.transport === "public" ? "foot" : opts.transport === "car" ? "driving" : opts.transport === "bike" ? "bike" : "foot";

    const p: Plan = {
      id,
      title,
      steps: [ { kind: "start", name: "Start", coord: center }, ...itin.steps.map(s => ({ kind: "poi" as const, name: s.name, coord: { lat: s.lat, lon: s.lon }, category: s.category as any })) ],
      mode,
      stops: itin.steps.map(s => ({ name: s.name, lat: s.lat, lon: s.lon })),
      km: Math.round((itin.travelMin * (mode === "foot" ? 0.08 : mode === "bike" ? 0.24 : 0.3)) * 10) / 10, // aproximativ
      min: Math.min(opts.duration, itin.travelMin + itin.visitMin),
      cost: (budget === Infinity ? (costUnknown ? undefined : cost) : Math.min(cost, budget)) as any,
      routeSegments,
    };

    plans.push(p);
  }

  // Nu livrăm planuri goale; dacă nu s-au construit rute valide, întoarcem [] pentru empty state in Results
  return plans;
}

