# Plan Generation Fixes - Rezolvarea Problemei de Blocare

Acest document descrie reparațiile efectuate pentru a rezolva problema de blocare în generarea planurilor.

## 🐛 **Problema Identificată**

După implementarea rutării reale cu OSRM, aplicația nu mai genera niciun plan din cauza:

1. **Funcții asincrone fără timeout**: Apelurile OSRM puteau să se blocheze indefinit
2. **Prea multe apeluri simultane**: Se încerca rutarea reală pentru prea multe POI-uri simultan
3. **Lipsa fallback-ului**: Dacă OSRM eșua, nu exista o alternativă
4. **Scope-ul variabilelor**: Variabilele A, B, C nu erau accesibile în afara try-catch

## ✅ **Reparațiile Efectuate**

### 1. **Timeout-uri pentru Toate Operațiunile Asincrone**

**POI Selection cu Timeout:**

```typescript
const withRealDist = await Promise.race([
  Promise.all(
    limitedCandidates.map(async (p) => {
      /* routing */
    }),
  ),
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)), // 3 sec
]);
```

**Segment Routing cu Timeout:**

```typescript
const route = await Promise.race([
  calculateRealRoute(cur, found, segmentKind),
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)), // 2 sec
]);
```

**Plan Generation cu Timeout:**

```typescript
const [A, B, C] = await Promise.race([
  Promise.all([
    /* plan generation */
  ]),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Plan generation timeout")), 15000),
  ), // 15 sec
]);
```

### 2. **Limitarea Numărului de Apeluri OSRM**

**Înainte:**

- Se încerca rutarea pentru toți candidații POI
- Fără limită de timp sau număr

**După:**

```typescript
// Limit to 5 candidates for performance
const limitedCandidates = candidates.slice(0, 5);
```

### 3. **Fallback Complet la Planuri Simple**

**Funcția `buildSimplePlan`:**

```typescript
function buildSimplePlan(
  id: string,
  title: string,
  start: LatLng,
  pool: POI[],
  seq: Array<POI["category"]>,
  transportMode: "foot" | "bike" | "driving",
): Plan {
  // Generează planuri fără rutare reală, doar cu haversine
  // Distanțe adaptive: driving=15km, bike=8km, foot=1.2km
}
```

**Fallback Logic:**

```typescript
try {
  // Încearcă planuri cu rutare reală
  [A, B, C] = await buildSinglePlan(...);
} catch (error) {
  // Fallback la planuri simple
  [A, B, C] = await buildSimplePlan(...);
}
```

### 4. **Corectarea Scope-ului Variabilelor**

**Înainte:**

```typescript
try {
  const [A, B, C] = await Promise.all([...]);
} catch {
  const [A, B, C] = await Promise.all([...]); // Scope diferit!
}
// A, B, C nu sunt accesibile aici
```

**După:**

```typescript
let A: Plan, B: Plan, C: Plan; // Declarate în afara

try {
  [A, B, C] = await Promise.all([...]);
} catch {
  [A, B, C] = await Promise.all([...]);
}
// A, B, C sunt accesibile aici
```

### 5. **Logging Detaliat pentru Debugging**

```typescript
console.log(`[GeneratePlans] Creating plans with transport mode: ${transportMode}`);
console.log(
  `[GeneratePlans] Successfully created ${A ? "A" : ""}${B ? "B" : ""}${C ? "C" : ""} plans`,
);
console.warn(`[GeneratePlans] Real routing failed for ${transportMode}, using haversine fallback`);
console.error(`[GeneratePlans] Plan generation failed:`, error);
```

## 🚀 **Strategia de Fallback**

### Niveluri de Fallback:

1. **Nivel 1**: Rutare reală cu OSRM (ideal)
2. **Nivel 2**: Haversine cu factori de corecție pentru transport
3. **Nivel 3**: Planuri simple fără rutare reală
4. **Nivel 4**: Planuri de bază cu POI-uri aproape

### Timeout-uri Progresive:

| Operațiune          | Timeout    | Fallback       |
| ------------------- | ---------- | -------------- |
| **POI Selection**   | 3 secunde  | Haversine      |
| **Segment Routing** | 2 secunde  | Segment simplu |
| **Plan Generation** | 15 secunde | Planuri simple |

## 🧪 **Testare**

### Pentru a testa reparațiile:

1. **Pornește aplicația**: `npx expo start`
2. **Selectează diferite transporturi**
3. **Verifică în consolă**:
   - `[GeneratePlans] Creating plans with transport mode: driving`
   - `[GeneratePlans] Successfully created ABC plans`
4. **Dacă apar timeout-uri**:
   - `[GeneratePlans] Real routing failed, using haversine fallback`
   - `[GeneratePlans] Falling back to simple plans`

### Comportament Așteptat:

- ✅ **Planurile se generează întotdeauna** (cu sau fără rutare reală)
- ✅ **Timp maxim de așteptare**: 15 secunde
- ✅ **Fallback automat** la planuri simple dacă OSRM eșuează
- ✅ **Logging clar** pentru debugging

## 📁 **Fișiere Modificate**

1. **`utils/generatePlans.ts`**:
   - Adăugat timeout-uri pentru toate operațiunile asincrone
   - Creat funcția `buildSimplePlan` ca fallback
   - Corectat scope-ul variabilelor A, B, C
   - Adăugat logging detaliat

## 🎯 **Rezultate**

- ✅ **Aplicația nu se mai blochează** la generarea planurilor
- ✅ **Fallback automat** când rutarea reală eșuează
- ✅ **Performanță îmbunătățită** prin limitarea apelurilor OSRM
- ✅ **Debugging ușor** prin logging detaliat
- ✅ **Experiență utilizator consistentă** indiferent de starea OSRM

Aplicația acum generează planuri în mod fiabil, cu rutare reală când este posibil și fallback când este necesar!
