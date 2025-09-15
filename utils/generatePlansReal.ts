import { locationService } from "../lib/locationService"
import type { GenerateOptions, LatLng, Plan, POI } from "../lib/planTypes"
import { logPlans } from "./debugPlans"
import { fetchPOIsAround, fetchPOIsInCity, type OverpassCategory } from "./overpass"
import { getSearchRadiusKm } from "./planRadius"

function hav(a: LatLng, b: LatLng) {
  const R = 6371e3
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function travelMinutes(meters: number, mode: Plan["mode"]) {
  if (mode === "foot") return Math.ceil(meters / (1.35 * 60))
  if (mode === "bike") return Math.ceil(meters / (4.0 * 60))
  return Math.ceil(meters / (5.0 * 60))
}

function stopsByDuration(mins: number) {
  if (mins <= 120) return 2
  if (mins <= 240) return 3
  if (mins <= 360) return 4
  if (mins <= 480) return 5
  if (mins <= 600) return 6
  return 6
}

function defaultDuration(category: string): number {
  switch (category) {
    case "cinema": return 90
    case "museum": return 35
    case "park": return 30
    case "bar": return 45
    case "cafe": return 35
    case "restaurant": return 40
    default: return 35
  }
}

function estimatedCost(category: string): number | undefined {
  switch (category) {
    case "cinema": return 40
    case "museum": return 30
    case "bar": return 50
    case "cafe": return 40
    case "park": return 0
    default: return undefined
  }
}

async function getWeatherFlags(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,apparent_temperature,windspeed_10m&forecast_days=1&timezone=auto`
    const res = await fetch(url)
    const j = await res.json()
    const hourly = j?.hourly
    const pp: number[] = hourly?.precipitation_probability || []
    const appT: number[] = hourly?.apparent_temperature || []
    const wind: number[] = hourly?.windspeed_10m || []
    const rainSoon = pp.slice(0, 3).some((p) => (p || 0) >= 50)
    const hot = appT.slice(0, 6).some((v) => (v || 0) >= 35)
    const windStrong = wind.slice(0, 6).some((v) => (v || 0) >= 40)
    return { rainSoon, hot, windStrong }
  } catch {
    return { rainSoon: false, hot: false, windStrong: false }
  }
}

function modeFromTransport(t?: GenerateOptions["transport"]): Plan["mode"] {
  if (t === "bike") return "bike"
  if (t === "car") return "driving"
  return "foot"
}

function radiusFor(transport: GenerateOptions["transport"], duration: number) {
  const transportType = transport === "walk" ? "walk" :
    transport === "bike" ? "bike" :
    transport === "public" ? "public" :
    transport === "car" ? "car" : "walk"
  const radiusKm = getSearchRadiusKm(duration, transportType)
  return Math.round(radiusKm * 1000)
}

function withinSegmentLimit(transport: GenerateOptions["transport"], meters: number) {
  if (transport === "walk") return meters <= 2500
  if (transport === "bike") return meters <= 5000
  if (transport === "public") return meters <= 12000
  if (transport === "car") return meters <= 20000
  return true
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = arr.slice()
  const out: T[] = []
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

export async function generatePlans(opts: GenerateOptions, signal?: AbortSignal): Promise<Plan[]> {
  if (signal?.aborted) return []

  logPlans("input.params", opts)

  let center: LatLng = opts.center || { lat: 44.4268, lon: 26.1025 }
  if (!opts.center) {
    try {
      const loc = await locationService.getCurrentLocation({ timeout: 8000, highAccuracy: true })
      center = { lat: loc.latitude, lon: loc.longitude }
    } catch {}
  }

  const wx = await getWeatherFlags(center.lat, center.lon)

  const allowed: OverpassCategory[] = [
    "cafe","restaurant","fast_food","tea_room","bar","pub",
    "cinema","library","museum","gallery","zoo","aquarium","attraction",
    "fitness_centre","sports_centre","bowling_alley","escape_game","swimming_pool","climbing_indoor",
    "arcade","karaoke","spa","park"
  ]

  const initialRad = radiusFor(opts.transport || "walk", opts.duration)
  const radiusAttempts = [initialRad, Math.round(initialRad * 1.5), Math.round(initialRad * 2), 12000]
  let requireOpen = true
  let selectedPois: POI[] = []
  let statsSummary = { raw: 0, filtered: 0, afterWho: 0, radius: initialRad, requireOpen }

  function categoriesWantedBase() {
    const w = opts.withWho
    if (w === "partner") return ["cafe","restaurant","gallery","cinema","park"]
    if (w === "family") return ["park","museum","cafe","restaurant","cinema"]
    if (w === "solo") return ["cafe","museum","park","cinema","restaurant"]
    return ["cafe","restaurant","bar","cinema","park"]
  }

  let categoriesWanted = categoriesWantedBase()
  if (wx.rainSoon) categoriesWanted = categoriesWanted.filter(c => c !== "park")
  if (wx.hot) categoriesWanted = categoriesWanted.map(c => c === "park" ? "cafe" : c)

  for (let attempt = 0; attempt < radiusAttempts.length; attempt++) {
    if (signal?.aborted) return []
    const rad = radiusAttempts[attempt]
    const stats = { raw: 0, filtered: 0 }
    let pois: POI[] = []
    try {
      pois = await fetchPOIsAround(center, allowed, rad, 20, signal, stats)
    } catch {
      try {
        pois = await fetchPOIsInCity(center, allowed, 20, signal, stats)
      } catch {}
    }

    const afterOpen = requireOpen ? pois.filter(p => p.openStatus !== "closed") : pois
    const afterWho = afterOpen.filter(p => categoriesWanted.includes(p.category as any))

    statsSummary = { raw: stats.raw, filtered: afterOpen.length, afterWho: afterWho.length, radius: rad, requireOpen } as any

    if (afterWho.length > 0) {
      selectedPois = afterWho
      break
    }

    if (attempt === 1) requireOpen = false
  }

  try {
    const nearest = selectedPois
      .map(p => ({ p, d: hav(center, { lat: p.lat, lon: p.lon }) }))
      .sort((a,b)=>a.d-b.d)
      .slice(0,3)
      .map(x => x.p.name)
    logPlans("overpass.stats", { center, ...statsSummary, sample: nearest })
  } catch {}

  const desiredStops = Math.max(1, stopsByDuration(opts.duration))
  const maxTravelShare = opts.duration <= 150 ? 0.35 : 0.30
  const maxTravelMin = Math.floor(opts.duration * maxTravelShare)

  const mode = modeFromTransport(opts.transport)
  const transport = opts.transport || "walk"

  logPlans("itinerary.config", { desiredStops, maxTravelMin, transport, categoriesWanted })

  function recomputeTimes(anchor: LatLng, steps: { lat: number; lon: number; category: string }[]) {
    let travelMin = 0
    let visitMin = 0
    let last = anchor
    for (const s of steps) {
      const dist = hav(last, { lat: s.lat, lon: s.lon })
      travelMin += travelMinutes(dist, mode)
      visitMin += defaultDuration(s.category)
      last = { lat: s.lat, lon: s.lon }
    }
    return { travelMin, visitMin }
  }

  function buildItinerary(anchor: LatLng, cats: string[]) {
    const results: { name: string; lat: number; lon: number; category: string }[] = []
    const usedIds = new Set<string>()

    const byDist = selectedPois
      .map(p => ({ p, d: hav(anchor, { lat: p.lat, lon: p.lon }) }))
      .sort((a,b) => a.d - b.d)
      .map(x => x.p)

    for (const cat of cats) {
      const pool = byDist.filter(p => p.category === (cat as any) && !usedIds.has(p.id))
      if (!pool.length) continue
      const last = results.length ? results[results.length - 1] : null
      const from = last ? { lat: last.lat, lon: last.lon } : anchor
      const candidate = pool
        .map(p => ({ p, d: hav(from, { lat: p.lat, lon: p.lon }) }))
        .sort((a,b) => a.d - b.d)[0]?.p
      if (!candidate) continue

      const dist = hav(from, { lat: candidate.lat, lon: candidate.lon })
      const segMin = travelMinutes(dist, mode)
      const stopMin = defaultDuration(candidate.category)
      const { travelMin, visitMin } = recomputeTimes(anchor, [...results, { lat: candidate.lat, lon: candidate.lon, category: candidate.category }])
      const newTotalTime = travelMin + visitMin

      if (!withinSegmentLimit(transport, dist)) continue
      if (newTotalTime > opts.duration) break

      results.push({ name: candidate.name, lat: candidate.lat, lon: candidate.lon, category: candidate.category })
      usedIds.add(candidate.id)
      if (results.length >= desiredStops) break
    }

    if (!results.length) return null

    let { travelMin, visitMin } = recomputeTimes(anchor, results)
    if (travelMin > maxTravelMin) {
      while (results.length > 1 && travelMin > maxTravelMin) {
        results.pop()
        const rec = recomputeTimes(anchor, results)
        travelMin = rec.travelMin
        visitMin = rec.visitMin
      }
    }
    if (visitMin <= 0) return null

    return { steps: results, travelMin, visitMin }
  }

  const anchors = pick(selectedPois, 5).map(p => ({ lat: p.lat, lon: p.lon }))
  const plans: Plan[] = []

  for (let i = 0; i < 5 && plans.length < 3; i++) {
    const anchor = anchors[i] || center
    const cats = categoriesWanted.slice()
    const itin = buildItinerary(anchor, cats)
    if (!itin) continue

    let cost = 0
    let costUnknown = false
    for (const s of itin.steps) {
      const c = estimatedCost(s.category)
      if (typeof c === "number") cost += c
      else costUnknown = true
    }

    const budget = opts.budget == null ? Infinity : opts.budget
    let steps = itin.steps.slice()
    if (budget !== Infinity) {
      while (steps.length > 1 && cost > budget) {
        const removed = steps.pop()!
        const c = estimatedCost(removed.category)
        if (typeof c === "number") cost -= c
      }
    }
    const times = recomputeTimes(center, steps)
    const km = Math.round((times.travelMin * (mode === "foot" ? 0.08 : mode === "bike" ? 0.24 : 0.3)) * 10) / 10

    const id = ["A","B","C"][plans.length] || String(plans.length)
    const title = plans.length === 0 ? "Echilibrat" : plans.length === 1 ? "Social" : "Cultural"

    const p: Plan = {
      id,
      title,
      steps: [{ kind: "start", name: "Start", coord: center }, ...steps.map(s => ({ kind: "poi" as const, name: s.name, coord: { lat: s.lat, lon: s.lon }, category: s.category as any }))],
      mode,
      stops: steps.map(s => ({ name: s.name, lat: s.lat, lon: s.lon })),
      km,
      min: Math.min(opts.duration, times.travelMin + times.visitMin),
      cost: budget === Infinity ? (costUnknown ? undefined : cost) : Math.min(cost, budget) as any,
      routeSegments: [],
    }

    plans.push(p)
  }

  logPlans("output.plans", plans.map(pl => ({ id: pl.id, steps: pl.steps.length, km: pl.km, min: pl.min, cost: pl.cost })))
  return plans
}

