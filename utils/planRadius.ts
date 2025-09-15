export type TransportKind = "walk" | "bike" | "public" | "car"

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v))
}

export function getSearchRadiusKm(durationMin: number, transport: TransportKind) {
  const h = Math.max(0.5, durationMin / 60)
  if (transport === "walk") return clamp(0.8, 3.0, 1.3 * h)
  if (transport === "bike") return clamp(2.5, 8.0, 5.0 * h)
  if (transport === "public") return clamp(3.0, 12.0, 6.5 * h)
  return clamp(4.0, 15.0, 8.0 * h)
}
