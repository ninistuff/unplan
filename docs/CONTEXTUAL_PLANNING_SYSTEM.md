# Contextual Planning System - Planuri Reale Bazate pe Context

Acest document descrie sistemul inteligent de planificare contextuală care generează planuri reale bazate pe vreme, locație, timp și preferințele utilizatorului.

## 🧠 **Sistemul Inteligent de Planificare**

### 1. **Analiza Contextuală Completă**

**Factori Analizați:**

- ☀️ **Vreme**: Temperatură, condiții meteorologice (însorit, înnorat, ploios)
- 🕐 **Timpul zilei**: Dimineață, după-amiază, seară, noapte
- 📅 **Ziua săptămânii**: Săptămână vs weekend
- 🍂 **Sezonul**: Primăvară, vară, toamnă, iarnă
- 📍 **Locația**: Coordonate GPS și oraș
- 👥 **Compania**: Solo, prieteni, familie, animal de companie
- 💰 **Bugetul**: Limitat sau nelimitat
- ⏱️ **Durata**: Timp disponibil pentru activități

### 2. **Integrarea Meteo în Timp Real**

**API Open-Meteo Integration:**

```typescript
async function getCurrentWeather(location: LatLng): Promise<WeatherData | null> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`,
  );
  // Procesează codurile meteo și returnează condiții simplificate
}
```

**Condiții Meteo Procesate:**

- **Sunny** (0): Vreme frumoasă
- **Cloudy** (1,2,3): Înnorat
- **Rainy** (51,53,55,56,57,61,63,65,66,67,80,81,82): Ploios

## 🎯 **Logica de Selecție Contextuală**

### 1. **Ajustări Bazate pe Vreme**

**Vreme Ploioasă:**

```typescript
if (condition === "rainy") {
  weights.museum += 0.8; // Favorizează muzee
  weights.cinema += 0.7; // Favorizează cinematografe
  weights.cafe += 0.6; // Favorizează cafenele
  weights.park -= 0.9; // Descurajează parcurile
  weights.bar += 0.3; // Socializare în interior
}
```

**Temperaturi Extreme:**

```typescript
if (temperature < 5) {
  // Vreme foarte rece - spații calde
  weights.cafe += 0.7; // Cafenele calde
  weights.museum += 0.5; // Muzee încălzite
  weights.park -= 0.8; // Evită exteriorul
} else if (temperature > 25) {
  // Vreme caldă - umbră și aer condiționat
  weights.park += 0.6; // Parcuri cu umbră
  weights.cafe += 0.4; // Aer condiționat
  weights.museum += 0.3; // Interior răcoros
}
```

### 2. **Ajustări Bazate pe Timpul Zilei**

**Dimineața (6-12):**

```typescript
weights.cafe += 0.8; // Cafea de dimineață
weights.park += 0.6; // Plimbări matinale
weights.bar -= 0.9; // Barurile sunt închise
```

**Seara (18-22):**

```typescript
weights.bar += 0.8; // Socializare de seară
weights.cinema += 0.6; // Filme de seară
weights.museum -= 0.5; // Multe muzee închise
```

### 3. **Ajustări Bazate pe Companie**

**Cu Animalul de Companie:**

```typescript
if (opts.withWho === "pet") {
  weights.park += 1.5; // Parcuri pet-friendly
  weights.cafe += 0.2; // Unele cafenele permit animale
  weights.museum -= 0.9; // Muzeele nu permit animale
  weights.cinema -= 0.9; // Cinematografele nu permit animale
}
```

**Cu Familia și Copii:**

```typescript
if (opts.withWho === "family" && childAge > 0) {
  weights.park += 0.8; // Activități pentru copii
  weights.museum += 0.5; // Educațional pentru copii
  weights.bar -= 0.9; // Neadecvat pentru copii
}
```

## 💰 **Sistem Inteligent de Buget**

### 1. **Costuri Adaptive pe Context**

**Ajustări de Preț Contextuale:**

```typescript
if (context.weather?.condition === "rainy") {
  // Cerere mai mare pentru activități interioare
  adjustedCosts.cinema += 10;
  adjustedCosts.museum += 5;
  adjustedCosts.cafe += 5;
}

if (context.timeOfDay === "evening" || context.dayOfWeek === "weekend") {
  // Tarife de seară și weekend
  adjustedCosts.bar += 15;
  adjustedCosts.cinema += 10;
}
```

**Costuri de Bază:**

- 🏞️ **Parc**: 0 lei (gratuit)
- ☕ **Cafenea**: 15 lei
- 🍺 **Bar**: 30 lei
- 🏛️ **Muzeu**: 30 lei
- 🎬 **Cinema**: 50 lei

### 2. **Optimizarea Bugetului**

**Înlocuirea Inteligentă:**

```typescript
// Înlocuiește activitățile scumpe cu alternative mai ieftine
if (total > budget) {
  // Înlocuiește cinema (50 lei) cu cafenea (15 lei)
  // Înlocuiește bar (30 lei) cu parc (0 lei)
  // Păstrează întotdeauna o opțiune gratuită (parc)
}
```

## 🗺️ **Generarea Secvențelor Inteligente**

### 1. **Algoritm de Selecție Ponderat**

```typescript
function selectWeightedCategory(excludeCategories = []) {
  const availableCategories = categories.filter((cat) => !excludeCategories.includes(cat));
  const totalWeight = availableCategories.reduce((sum, cat) => sum + weights[cat], 0);
  let random = Math.random() * totalWeight;

  for (const cat of availableCategories) {
    random -= weights[cat];
    if (random <= 0) return cat;
  }
}
```

### 2. **Diversitate în Planuri**

**Plan A - Conservator:**

- Prima oprire: Categoria cu cea mai mare pondere
- Strategia de distanță: "nearest" (cel mai aproape)

**Plan B - Echilibrat:**

- Prima oprire: A doua categorie ca pondere
- Strategia de distanță: "middle" (distanță medie)

**Plan C - Aventuros:**

- Prima oprire: A treia categorie ca pondere
- Strategia de distanță: "far" (mai departe)

## 📊 **Exemple de Planuri Contextuale**

### Exemplu 1: Duminică Dimineața, Însorit, 22°C, Cu Familia

**Context Analizat:**

- ☀️ Vreme perfectă (15-25°C)
- 🌅 Dimineață (cafea + activități)
- 📅 Weekend (mai mult timp liber)
- 👨‍👩‍👧‍👦 Familie cu copii

**Planuri Generate:**

- **Plan A**: Parc → Cafenea → Muzeu
- **Plan B**: Cafenea → Parc → Muzeu
- **Plan C**: Muzeu → Parc → Cafenea

### Exemplu 2: Vineri Seara, Ploios, 8°C, Cu Prietenii

**Context Analizat:**

- 🌧️ Ploios (activități interioare)
- 🌆 Seara (socializare)
- 📅 Vineri (ieșire cu prietenii)
- 👥 Grup de prieteni

**Planuri Generate:**

- **Plan A**: Bar → Cinema → Cafenea
- **Plan B**: Cinema → Bar → Cafenea
- **Plan C**: Cafenea → Bar → Cinema

### Exemplu 3: Miercuri Prânz, Înnorat, 15°C, Solo

**Context Analizat:**

- ☁️ Înnorat (activități mixte)
- 🕐 Prânz (timp limitat)
- 📅 Miercuri (zi lucrătoare)
- 🧍 Solo (activități contemplative)

**Planuri Generate:**

- **Plan A**: Muzeu → Cafenea
- **Plan B**: Cafenea → Muzeu
- **Plan C**: Parc → Cafenea

## 🧪 **Testarea Sistemului**

### Pentru a testa planificarea contextuală:

1. **Pornește aplicația**: `npx expo start`
2. **Modifică setările**:
   - Schimbă timpul zilei
   - Testează cu vreme diferită
   - Încearcă companii diferite
   - Variază bugetul

### Logs-uri Așteptate:

```
[GeneratePlans] Starting CONTEXTUAL plan generation
[ContextualPlanning] Fetching weather for 44.4268, 26.1025
[ContextualPlanning] Weather: 18°C, sunny in București
[ContextualPlanning] Context: afternoon weekday in autumn, weather: sunny
[ContextualPlanning] Analyzing context for POI selection
[ContextualPlanning] Perfect weather (18°C) - all activities suitable
[ContextualPlanning] Afternoon time - balanced activities
[ContextualPlanning] Weekday - quick activities
[ContextualPlanning] With family and children - family-friendly activities
[ContextualPlanning] Final category weights: {park: 1.7, cafe: 1.6, museum: 1.2, cinema: 0.6}
[ContextualPlanning] Plan A sequence: park → cafe → museum
[ContextualPlanning] Plan B sequence: cafe → park → museum
[ContextualPlanning] Plan C sequence: museum → park → cafe
```

## 🎯 **Beneficii**

- ✅ **Planuri Realiste**: Adaptate la condițiile actuale
- ✅ **Economie de Timp**: Nu mai pierzi timpul cu activități neadecvate
- ✅ **Buget Optimizat**: Respectă limitele financiare
- ✅ **Experiență Personalizată**: Adaptată la preferințe și context
- ✅ **Diversitate**: Trei planuri diferite pentru alegere

Sistemul acum generează planuri cu adevărat inteligente și contextuale!
