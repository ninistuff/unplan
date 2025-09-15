export type Transport = 'walk' | 'bike' | 'public' | 'car';

const SPEED_KMH: Record<Transport, number> = {
  walk: 4.5,
  bike: 15,
  public: 20,
  car: 35, // urban
};

export function getSearchRadiusKm(durationMinutes: number, transport: Transport) {
  const speed = SPEED_KMH[transport] ?? 4.5;
  const hours = Math.max(durationMinutes, 15) / 60;
  // mergem pe jumătate din distanța dus-întors, cu o marjă de 0.6
  const distance = speed * hours * 0.6;
  // limitează în oraș
  return Math.max(1, Math.min(distance, 20)); // 1..20 km
}
