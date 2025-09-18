# Map Debugging Guide - Ghid pentru Debugging Harta

Acest document descrie pașii de debugging implementați pentru a identifica și rezolva problemele cu încărcarea hărții.

## 🔍 **Strategia de Debugging Implementată**

### 1. **Logging Detaliat în WebView**

**React Native Side (`app/plan/[id].tsx`):**

```typescript
const onWebViewLoad = () => {
  console.log("[PlanDetails] WebView loaded, waiting for map initialization");
  setTimeout(() => {
    console.log("[PlanDetails] Injecting renderPlan after delay");
    webRef.current?.injectJavaScript(`
      try {
        console.log('[WebView] Checking if renderPlan exists:', typeof window.renderPlan);
        if (typeof window.renderPlan === 'function') {
          console.log('[WebView] Calling renderPlan with payload');
          window.renderPlan(${payloadJS});
          console.log('[WebView] renderPlan completed successfully');
        } else {
          console.error('[WebView] renderPlan function not found');
        }
      } catch(e) {
        console.error('[WebView] renderPlan error:', e.message, e.stack);
      }
      true;
    `);
  }, 1000); // 1 second delay
};
```

**WebView Error Handling:**

```typescript
<WebView
  onError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[PlanDetails] WebView error:', nativeEvent);
  }}
  onHttpError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[PlanDetails] WebView HTTP error:', nativeEvent);
  }}
  onLoadStart={() => console.log('[PlanDetails] WebView load started')}
  onLoadEnd={() => console.log('[PlanDetails] WebView load ended')}
  // ... other props
/>
```

### 2. **Logging Detaliat în HTML Map**

**Inițializarea Leaflet:**

```javascript
console.log("[MapHTML] Script started, checking Leaflet...");
console.log("[MapHTML] Leaflet available:", typeof L);
console.log("[MapHTML] Initializing map...");
const map = L.map("map", { zoomControl: true });
console.log("[MapHTML] Map created, adding tile layer...");
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);
console.log("[MapHTML] Tile layer added, setting initial view...");
map.setView([45.9432, 24.9668], 6);
console.log("[MapHTML] Map initialization complete");
```

**Confirmarea Funcției renderPlan:**

```javascript
console.log("[MapHTML] renderPlan function defined:", typeof window.renderPlan);

document.addEventListener("DOMContentLoaded", function () {
  console.log("[MapHTML] DOM loaded, map ready for renderPlan calls");
});
```

### 3. **Simplificarea Temporară a Avatarului**

**Avatar Complex (problematic):**

```javascript
// Complex avatar with error handling - poate cauza probleme
var avatarHtml = '<div style="..."><img src="..." onerror="...complex fallback..."/></div>';
```

**Avatar Simplificat (pentru debugging):**

```javascript
// Simplified user location marker (temporarily removing complex avatar)
console.log("[MapHTML] Creating start marker, avatar:", avatar ? "present" : "none");
icon = L.divIcon({
  html: '<div style="width:36px;height:36px;border-radius:50%;background:#16a34a;border:4px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px">📍</div>',
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});
```

## 🧪 **Pași de Debugging**

### Pasul 1: Verifică Logs-urile WebView

**Logs-uri de succes așteptate:**

```
[PlanDetails] Payload for map: {points: [...], mode: "foot", segments: [], userAvatar: "..."}
[PlanDetails] WebView load started
[PlanDetails] WebView load ended
[PlanDetails] WebView loaded, waiting for map initialization
[PlanDetails] Injecting renderPlan after delay
```

**Logs-uri de eroare posibile:**

```
[PlanDetails] WebView error: {description: "...", code: ...}
[PlanDetails] WebView HTTP error: {statusCode: 404, url: "..."}
```

### Pasul 2: Verifică Logs-urile HTML Map

**Logs-uri de succes așteptate:**

```
[MapHTML] Script started, checking Leaflet...
[MapHTML] Leaflet available: object
[MapHTML] Initializing map...
[MapHTML] Map created, adding tile layer...
[MapHTML] Tile layer added, setting initial view...
[MapHTML] Map initialization complete
[MapHTML] renderPlan function defined: function
[MapHTML] DOM loaded, map ready for renderPlan calls
```

**Logs-uri de eroare posibile:**

```
[MapHTML] Leaflet available: undefined  // Leaflet nu s-a încărcat
[MapHTML] Error in renderPlan: ReferenceError: L is not defined
```

### Pasul 3: Verifică Apelul renderPlan

**Logs-uri de succes așteptate:**

```
[WebView] Checking if renderPlan exists: function
[WebView] Calling renderPlan with payload
[MapHTML] renderPlan called with payload: {points: [...], ...}
[MapHTML] Processing 3 points, avatar: present
[MapHTML] Successfully displayed 3 location markers
[MapHTML] Map fitted to bounds
[WebView] renderPlan completed successfully
```

**Logs-uri de eroare posibile:**

```
[WebView] renderPlan function not found
[WebView] renderPlan error: SyntaxError: Unexpected token
[MapHTML] Error in renderPlan: TypeError: Cannot read property 'lat' of undefined
```

## 🔧 **Soluții pentru Probleme Comune**

### Problema 1: Leaflet Nu Se Încarcă

**Simptome:**

```
[MapHTML] Leaflet available: undefined
```

**Soluții:**

- Verifică conexiunea la internet
- Verifică dacă CDN-ul Leaflet este accesibil
- Încearcă o versiune diferită de Leaflet

### Problema 2: renderPlan Nu Există

**Simptome:**

```
[WebView] renderPlan function not found
```

**Soluții:**

- Verifică dacă script-ul HTML se execută complet
- Adaugă delay mai mare înainte de apelul renderPlan
- Verifică dacă există erori de sintaxă în HTML

### Problema 3: Erori de Parsing JSON

**Simptome:**

```
[WebView] renderPlan error: SyntaxError: Unexpected token
```

**Soluții:**

- Verifică dacă payload-ul conține caractere speciale
- Escape-uiește corect string-urile în JSON
- Verifică dacă avatarUri conține caractere problematice

### Problema 4: Markerii Nu Apar

**Simptome:**

```
[MapHTML] Successfully displayed 3 location markers
// Dar markerii nu sunt vizibili
```

**Soluții:**

- Verifică dacă coordonatele sunt valide
- Verifică dacă harta se centrează corect
- Verifică CSS-ul pentru markeri

## 📊 **Checklist de Debugging**

### ✅ **Verificări de Bază:**

- [ ] **WebView se încarcă**: Logs `[PlanDetails] WebView load ended`
- [ ] **Leaflet disponibil**: Logs `[MapHTML] Leaflet available: object`
- [ ] **Map inițializată**: Logs `[MapHTML] Map initialization complete`
- [ ] **renderPlan definită**: Logs `[MapHTML] renderPlan function defined: function`

### ✅ **Verificări de Funcționare:**

- [ ] **Payload valid**: Logs `[PlanDetails] Payload for map: {...}`
- [ ] **renderPlan apelată**: Logs `[WebView] Calling renderPlan with payload`
- [ ] **Markeri procesați**: Logs `[MapHTML] Processing X points`
- [ ] **Markeri afișați**: Logs `[MapHTML] Successfully displayed X location markers`

### ✅ **Verificări Vizuale:**

- [ ] **Harta se încarcă**: Tile-urile OpenStreetMap sunt vizibile
- [ ] **Markerii apar**: POI-uri numerotate și marker de start
- [ ] **Centrarea funcționează**: Harta se centrează pe markeri
- [ ] **Interacțiunea funcționează**: Popup-urile se deschid la click

## 🎯 **Rezultate Așteptate**

După implementarea debugging-ului, ar trebui să vezi:

1. **Logs-uri complete** pentru fiecare pas al încărcării
2. **Identificarea precisă** a punctului de eșec
3. **Informații detaliate** despre erori
4. **Soluții țintite** pentru fiecare problemă

Acest sistem de debugging permite identificarea rapidă și precisă a problemelor cu harta!
