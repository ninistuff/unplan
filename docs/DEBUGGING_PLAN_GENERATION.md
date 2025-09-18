# Debugging Plan Generation - Rezolvarea Erorilor

Acest document descrie pașii pentru debugging și rezolvarea erorilor în generarea planurilor.

## 🐛 **Problema Raportată**

Utilizatorul raportează "plan generation failed error" - planurile nu se mai generează.

## 🔍 **Strategia de Debugging Implementată**

### 1. **Logging Detaliat Adăugat**

**În funcția principală `generatePlans`:**

```typescript
console.log(`[GeneratePlans] Starting plan generation with options:`, {
  transport: opts.transport,
  duration: opts.duration,
  budget: opts.budget,
  withWho: opts.withWho,
});
```

**Pentru locația utilizatorului:**

```typescript
console.log(`[GeneratePlans] Using user location: ${center.lat}, ${center.lon}`);
console.log(`[GeneratePlans] Using fallback location (Bucharest): ${center.lat}, ${center.lon}`);
```

**Pentru POI-urile găsite:**

```typescript
console.log(`[GeneratePlans] Found ${pois.length} POIs in city`);
console.log(`[GeneratePlans] POI distribution:`, poiCounts);
```

**Pentru planurile simple:**

```typescript
console.log(`[GeneratePlans] Building simple plan ${id} with mode ${transportMode}`);
console.log(
  `[GeneratePlans] Simple plan ${id}: ${pool.length} POIs available, max distance: ${maxDistance}m`,
);
console.log(`[GeneratePlans] Simple plan ${id}: Looking for ${cat} POI (${strat} strategy)`);
```

### 2. **Simplificarea Temporară**

Pentru a izola problema, am simplificat generarea planurilor:

**Înainte (complex cu rutare reală):**

```typescript
try {
  [A, B, C] = await Promise.race([
    Promise.all([buildSinglePlan(...)]),
    timeout
  ]);
} catch {
  [A, B, C] = await buildSimplePlan(...);
}
```

**Acum (simplu și fiabil):**

```typescript
// Always use simple plans for now to ensure they work
const [A, B, C] = await Promise.all([
  buildSimplePlan("A", "Plan A", center, [...pois], seqA2, transportMode),
  buildSimplePlan("B", "Plan B", center, [...pois], seqB2, transportMode),
  buildSimplePlan("C", "Plan C", center, [...pois], seqC2, transportMode),
]);
```

### 3. **Verificări de Siguranță**

**Verificarea POI-urilor:**

```typescript
if (pois.length === 0) {
  console.error(`[GeneratePlans] No POIs found! Cannot generate plans.`);
  return [];
}
```

**Planuri de urgență:**

```typescript
// Create minimal emergency plans
A = {
  id: "A",
  title: "Plan A",
  steps: [{ kind: "start", name: "Start", coord: center }],
  mode: transportMode,
  stops: [],
  km: 0,
};
```

## 🧪 **Cum să Testezi și să Debugging**

### 1. **Pornește aplicația cu logging:**

```bash
npx expo start
```

### 2. **Încearcă să generezi planuri și verifică consolele:**

**Logs-uri de succes așteptate:**

```
[GeneratePlans] Starting plan generation with options: {transport: "car", duration: 120, ...}
[GeneratePlans] Using user location: 44.4268, 26.1025
[GeneratePlans] Found 25 POIs in city
[GeneratePlans] POI distribution: {cafe: 8, bar: 5, museum: 4, park: 3, cinema: 5}
[GeneratePlans] Creating plans with transport mode: driving
[GeneratePlans] Using simple plan generation for reliability
[GeneratePlans] Building simple plan A with mode driving
[GeneratePlans] Simple plan A: 25 POIs available, max distance: 15000m
[GeneratePlans] Simple plan A: Looking for cafe POI (nearest strategy)
[GeneratePlans] Simple plan A: Found cafe POI: Starbucks
[GeneratePlans] Simple plan A completed: 3 steps, 2 segments, 2.5km
[GeneratePlans] Simple plans created: A=3 steps, B=3 steps, C=3 steps
```

**Logs-uri de eroare posibile:**

```
[GeneratePlans] City POI fetch failed, trying area fallback: Error...
[GeneratePlans] Both POI fetch methods failed: Error...
[GeneratePlans] No POIs found! Cannot generate plans.
[GeneratePlans] Simple plan A: No cafe POI found within 15000m
```

### 3. **Verifică problemele comune:**

| Eroare                          | Cauza Posibilă            | Soluția                      |
| ------------------------------- | ------------------------- | ---------------------------- |
| "No POIs found"                 | Overpass API indisponibil | Verifică conexiunea internet |
| "No cafe POI found"             | POI-uri prea departe      | Mărește `maxDistance`        |
| "Location access failed"        | Permisiuni locație        | Verifică permisiunile        |
| "Both POI fetch methods failed" | Probleme de rețea         | Verifică conectivitatea      |

## 🔧 **Reparații Implementate**

### 1. **Funcția `buildSimplePlan` Asincronă**

```typescript
async function buildSimplePlan(...): Promise<Plan> {
  console.log(`[GeneratePlans] Building simple plan ${id} with mode ${transportMode}`);
  // ... implementare simplă fără rutare reală
}
```

### 2. **Distanțe Adaptive pe Transport**

```typescript
const maxDistance = transportMode === "driving" ? 15000 : transportMode === "bike" ? 8000 : 1200;
```

### 3. **Logging pentru Fiecare Pas**

- Parametrii de intrare
- Locația utilizatorului
- POI-urile găsite
- Progresul generării planurilor
- Erorile întâlnite

### 4. **Planuri de Urgență**

Dacă totul eșuează, se creează planuri minimale cu doar punctul de start.

## 🎯 **Următorii Pași**

1. **Testează cu logging-ul nou** și identifică exact unde eșuează
2. **Verifică logs-urile** pentru a vedea dacă POI-urile sunt găsite
3. **Dacă POI-urile lipsesc**, verifică conexiunea la Overpass API
4. **Dacă planurile simple eșuează**, verifică logica de selecție POI
5. **După ce funcționează**, reactivează treptat rutarea reală

## 📊 **Monitorizare**

Urmărește aceste metrici în logs:

- ✅ **POI-uri găsite**: Minim 10-15 pentru planuri bune
- ✅ **Planuri generate**: Toate 3 (A, B, C) cu minim 2-3 steps fiecare
- ✅ **Timp de generare**: Sub 5 secunde pentru planuri simple
- ✅ **Erori**: Zero pentru planuri simple

Aplicația acum are logging detaliat pentru a identifica exact unde apare problema!
