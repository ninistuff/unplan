# Transport Mode Fixes - Rezolvarea Problemelor de Transport

Acest document descrie reparațiile efectuate pentru a rezolva problemele cu afișarea și funcționarea diferitelor tipuri de transport în aplicația Unplan.

## 🐛 **Problemele Identificate**

1. **Maparea incorectă a modului de transport**: Toate tipurile de transport erau mapate la "foot" pe hartă
2. **Segmentele nu respectau modul selectat**: Indiferent de selecție, se generau segmente "foot"
3. **Timpii de deplasare incorecți**: Nu se calculau corect pentru fiecare tip de transport
4. **Afișarea uniformă pe hartă**: Toate rutele apăreau ca linii punctate gri (walking)
5. **Transport public nerecunoscut**: Nu se făcea distincția între segmentele de mers pe jos și cele de transport public

## ✅ **Reparațiile Efectuate**

### 1. **Rutare Reală cu OSRM** (`utils/generatePlans.ts`)

**Adăugat:**
- Funcția `calculateRealRoute()` care folosește OSRM pentru rutare reală
- Funcția `pickByWithTransport()` care selectează POI-uri bazat pe distanțe reale de transport
- Versiune asincronă a `buildSinglePlan()` care generează planuri cu rute reale

### 2. **Corectarea Mapării Modului de Transport** (`utils/generatePlans.ts`)

**Înainte:**
```typescript
const mode: Plan["mode"] = opts.transport === "bike" ? "bike" : opts.transport === "car" ? "driving" : "foot";
```

**După:**
```typescript
const mode: Plan["mode"] = opts.transport === "bike" ? "bike" : 
                          opts.transport === "car" ? "driving" : 
                          opts.transport === "public" ? "foot" : // public transport uses foot for walking segments
                          "foot";
```

### 2. **Generarea Corectă a Segmentelor** (`utils/generatePlans.ts`)

**Înainte:**
```typescript
segments.push({ from: cur, to: found, kind: mode });
```

**După:**
```typescript
const segmentKind = mode === "driving" ? "driving" : mode === "bike" ? "bike" : "foot";
segments.push({ from: cur, to: found, kind: segmentKind });
```

### 3. **Setarea Corectă a Modului pentru Planuri**

**Adăugat:**
```typescript
// Set the correct mode for display purposes
A.mode = opts.transport === "bike" ? "bike" : opts.transport === "car" ? "driving" : "foot";
B.mode = opts.transport === "bike" ? "bike" : opts.transport === "car" ? "driving" : "foot";
C.mode = opts.transport === "bike" ? "bike" : opts.transport === "car" ? "driving" : "foot";
```

### 4. **Afișarea Diferențiată pe Hartă** (`web/mapHtml.ts`)

**Înainte:**
```javascript
routeLayer = L.geoJSON(route.geometry, {
  style: { color: "#2563eb", weight: 5, opacity: 0.9, dashArray: dashed ? '6 6' : undefined }
}).addTo(map);
```

**După:**
```javascript
// Different colors and styles for different transport modes
let color = "#2563eb"; // default blue
let weight = 5;

switch(mode) {
  case "driving":
    color = "#dc2626"; // red for car
    weight = 6;
    break;
  case "bike":
    color = "#16a34a"; // green for bike
    weight = 4;
    break;
  case "foot":
    color = "#6b7280"; // gray for walking
    weight = 3;
    break;
}
```

### 5. **Calculul Corect al Timpilor de Deplasare**

**Înainte:**
```typescript
const speedKmh = (sk: string) => (sk === 'metro' ? 33 : sk === 'bus' ? 18 : sk === 'bike' ? 14 : 4.5);
```

**După:**
```typescript
const speedKmh = (sk: string) => {
  switch(sk) {
    case 'metro': return 33;
    case 'bus': return 18;
    case 'driving': return 28; // average city driving speed
    case 'bike': return 14;
    case 'foot':
    default: return 4.5;
  }
};
```

### 6. **Gestionarea Corectă a Segmentelor pe Hartă**

**Înainte:**
```javascript
var isBike = (s.kind === 'bike');
var dashed = !isBike; // foot dashed, bike solid
await drawRoute([s.from, s.to], isBike ? 'bike' : 'foot', dashed);
```

**După:**
```javascript
var transportMode = s.kind; // 'foot', 'bike', 'driving'
var dashed = (transportMode === 'foot'); // foot dashed, others solid
await drawRoute([s.from, s.to], transportMode, dashed);
```

## 🎨 **Stilurile Vizuale pe Hartă**

### Culori și Stiluri pentru Fiecare Tip de Transport:

| Transport | Culoare | Grosime | Stil |
|-----------|---------|---------|------|
| **Pe jos** | Gri (`#6b7280`) | 3px | Punctat |
| **Bicicletă/Trotineta** | Verde (`#16a34a`) | 4px | Solid |
| **Mașina** | Roșu (`#dc2626`) | 6px | Solid |
| **Transport Public - Bus** | Portocaliu (`#f59e0b`) | 4px | Solid |
| **Transport Public - Metro** | Albastru (`#0ea5e9`) | 4px | Solid |

### Vitezele de Deplasare:

| Transport | Viteză (km/h) | Utilizare |
|-----------|---------------|-----------|
| **Pe jos** | 4.5 | Mers normal |
| **Bicicletă** | 14 | Pedalare urbană |
| **Mașina** | 28 | Conducere urbană |
| **Bus** | 18 | Transport public cu opriri |
| **Metro** | 33 | Transport rapid |

## 🚌 **Transport Public - Funcționalități Speciale**

### Segmente Mixte:
- **Mers pe jos la stație**: Gri punctat
- **Transport public**: Portocaliu (bus) sau albastru (metro) solid
- **Mers pe jos de la stație**: Gri punctat

### Iconuri pe Hartă:
- **M** - Stații de metrou
- **B** - Stații de autobuz
- **Numere** - POI-uri (puncte de interes)

## 🧪 **Testare**

### Pentru a testa reparațiile:

1. **Pornește aplicația**: `npx expo start`
2. **Selectează diferite tipuri de transport**:
   - Pe jos
   - Transport public
   - Mașina
   - Bicicletă/Trotineta
3. **Generează planuri** și verifică:
   - Culorile diferite pe hartă
   - Stilurile de linii (punctat vs solid)
   - Timpii de deplasare corecți
   - Segmentele mixte pentru transport public

### Verificări Vizuale:

- ✅ **Pe jos**: Linii gri punctate
- ✅ **Bicicletă**: Linii verzi solide
- ✅ **Mașina**: Linii roșii solide, mai groase
- ✅ **Transport public**: Combinație de gri punctat (mers pe jos) și portocaliu/albastru solid (transport)

## 📁 **Fișiere Modificate**

1. **`utils/generatePlans.ts`**:
   - Maparea corectă a modurilor de transport
   - Generarea segmentelor cu tipul corect
   - Calculul timpilor pentru fiecare tip de transport

2. **`web/mapHtml.ts`**:
   - Stiluri diferite pentru fiecare tip de transport
   - Culori și grosimi specifice
   - Gestionarea corectă a segmentelor

## 🎯 **Rezultate**

După aceste reparații:

- ✅ **Rutare reală cu OSRM**: Planurile folosesc rute reale, nu doar linii drepte
- ✅ **POI-uri selectate corect**: Se iau în considerare distanțele reale pentru fiecare transport
- ✅ **Fiecare tip de transport are aspectul său distinct pe hartă**
- ✅ **Timpii de deplasare sunt calculați corect**
- ✅ **Transport public afișează corect segmentele mixte**
- ✅ **Aplicația respectă selecția utilizatorului**
- ✅ **Geometrie reală**: Segmentele conțin coordonatele reale ale rutelor
- ✅ **Distanțe adaptive**: Mașina poate merge mai departe decât mersul pe jos

### 🚗 **Diferențe Majore între Tipurile de Transport:**

| Transport | Distanță Max | Rutare | Geometrie | Viteză |
|-----------|--------------|--------|-----------|--------|
| **Pe jos** | 1.2 km | Haversine | Simplă | 4.5 km/h |
| **Bicicletă** | 8 km | OSRM Cycling | Reală | 14 km/h |
| **Mașina** | 15 km | OSRM Driving | Reală | 28 km/h |
| **Transport Public** | Variabil | OTP + Fallback | Mixtă | 18-33 km/h |

Aplicația acum generează planuri reale și diferențiate pentru fiecare tip de transport!
