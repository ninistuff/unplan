# User Profile Enhancements - Vârstă, Limbă și Avatar

Acest document descrie îmbunătățirile aduse sistemului de profil utilizator pentru a include vârsta, limba și afișarea avatarului pe hartă.

## 🎯 **Îmbunătățiri Implementate**

### 1. **Integrarea Vârstei Utilizatorului în Planificare**

**Calculul Vârstei din Data Nașterii:**

```typescript
function getUserAge(opts: GenerateOptions): number | null {
  const dob = opts.userPrefs?.dob; // Format: YYYY-MM-DD
  if (!dob) return null;

  const dobDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();

  // Ajustare pentru luna și ziua
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }

  return age;
}
```

**Ajustări Contextuale pe Vârstă:**

| Grupa de Vârstă | Preferințe             | Ajustări                          |
| --------------- | ---------------------- | --------------------------------- |
| **< 25 ani**    | Activități energice    | +0.5 bar, +0.4 cinema, +0.3 park  |
| **25-40 ani**   | Activități echilibrate | +0.4 cafe, +0.3 bar, +0.2 museum  |
| **40-60 ani**   | Activități culturale   | +0.5 museum, +0.4 cafe, +0.3 park |
| **60+ ani**     | Activități relaxante   | +0.6 museum, +0.5 park, -0.3 bar  |

### 2. **Suport Multilingv pentru Mesaje Contextuale**

**Sistem de Localizare:**

```typescript
function getLocalizedMessage(key: string, opts: GenerateOptions, ...args: any[]): string {
  const lang = opts.userPrefs?.language || "ro"; // Default română

  const messages = {
    ro: {
      rainyWeather: "Vreme ploioasă - favorizez activități interioare",
      coldWeather: "Vreme rece ({0}°C) - favorizez spații calde interioare",
      youngAdult: "Tânăr adult ({0}) - activități energice",
      // ... alte mesaje în română
    },
    en: {
      rainyWeather: "Rainy weather - favoring indoor activities",
      coldWeather: "Cold weather ({0}°C) - favoring warm indoor spaces",
      youngAdult: "Young adult ({0}) - energetic activities",
      // ... alte mesaje în engleză
    },
  };

  let message = messages[lang]?.[key] || messages.ro[key] || key;
  // Înlocuire placeholder-uri {0}, {1}, etc.
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, String(arg));
  });

  return message;
}
```

**Mesaje Localizate:**

| Română                                             | English                                                 |
| -------------------------------------------------- | ------------------------------------------------------- |
| "Vreme ploioasă - favorizez activități interioare" | "Rainy weather - favoring indoor activities"            |
| "Tânăr adult (22) - activități energice"           | "Young adult (22) - energetic activities"               |
| "Cu familia și copii - activități family-friendly" | "With family and children - family-friendly activities" |
| "Weekend - mai multe activități de agrement"       | "Weekend - more leisure activities"                     |

### 3. **Avatar Îmbunătățit pe Hartă**

**Înainte:**

```javascript
// Cerc verde simplu cu pin
icon = L.divIcon({
  html: '<div class="num-pin start">📍</div>',
  iconSize: [32, 32],
});
```

**După:**

```javascript
// Avatar utilizator cu fallback elegant
if (avatar) {
  icon = L.divIcon({
    html:
      '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:4px solid #16a34a;box-shadow:0 4px 12px rgba(0,0,0,.3);background:#fff"><img src="' +
      avatar +
      '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div style=\\\"width:100%;height:100%;background:#16a34a;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px\\\">📍</div>\';"/></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
} else {
  // Fallback elegant fără avatar
  icon = L.divIcon({
    html: '<div style="width:36px;height:36px;border-radius:50%;background:#16a34a;border:4px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px">📍</div>',
    iconSize: [36, 36],
  });
}
```

**Caracteristici Avatar:**

- ✅ **Dimensiune mai mare**: 36x36px (în loc de 32x32px)
- ✅ **Border verde**: 4px solid #16a34a pentru identificare
- ✅ **Umbră pronunțată**: Shadow 0 4px 12px pentru vizibilitate
- ✅ **Fallback automat**: Dacă imaginea nu se încarcă, afișează pin verde
- ✅ **Error handling**: Gestionare elegantă a erorilor de încărcare

## 🔧 **Modificări în Cod**

### 1. **Tipuri Actualizate (`lib/planTypes.ts`)**

```typescript
userPrefs?: {
  age?: number | null;
  dob?: string; // YYYY-MM-DD format pentru calculul vârstei
  activity?: "relaxed" | "active";
  language?: 'en' | 'ro'; // Limba preferată a utilizatorului
  disabilities?: { /* ... */ };
  interests?: string[];
};
```

### 2. **Transmiterea Profilului (`app/results.tsx`)**

```typescript
userPrefs: {
  ...userPrefs,
  dob: user?.profile?.dob,           // Data nașterii
  language: user?.profile?.language, // Limba utilizatorului
},
```

### 3. **Afișarea Avatarului (`app/plan/[id].tsx`)**

```typescript
const payloadJS = JSON.stringify({
  points,
  mode: plan.mode,
  segments: plan.routeSegments || [],
  userAvatar: user?.profile?.avatarUri, // Avatar utilizator
});
```

## 🧪 **Testarea Îmbunătățirilor**

### Pentru a testa noile funcționalități:

1. **Setează vârsta în profil**:
   - Mergi la profilul utilizatorului
   - Setează data nașterii (YYYY-MM-DD)
   - Generează planuri și verifică ajustările pe vârstă

2. **Testează limba**:
   - Schimbă limba în profil (română/engleză)
   - Verifică logs-urile pentru mesaje localizate

3. **Testează avatarul**:
   - Setează o poză de profil
   - Deschide un plan pe hartă
   - Verifică că avatarul apare în loc de cercul verde

### Logs-uri Așteptate:

**Română:**

```
[ContextualPlanning] Analizez contextul pentru selecția POI-urilor
[ContextualPlanning] Vreme perfectă (18°C) - toate activitățile sunt potrivite
[ContextualPlanning] Vârsta utilizatorului: 28 - ajustez preferințele
[ContextualPlanning] Adult (28) - activități echilibrate
[ContextualPlanning] Cu prietenii - activități sociale
```

**English:**

```
[ContextualPlanning] Analyzing context for POI selection
[ContextualPlanning] Perfect weather (18°C) - all activities suitable
[ContextualPlanning] User age: 28 - adjusting preferences
[ContextualPlanning] Adult (28) - balanced activities
[ContextualPlanning] With friends - social activities
```

## 📊 **Exemple de Planuri pe Vârstă**

### Tânăr Adult (22 ani) - Vineri Seara cu Prietenii:

- **Plan A**: Bar → Cinema → Cafenea
- **Plan B**: Cinema → Bar → Parc
- **Plan C**: Parc → Bar → Cinema

### Adult (35 ani) - Sâmbătă Dimineața Solo:

- **Plan A**: Cafenea → Muzeu → Parc
- **Plan B**: Muzeu → Cafenea → Parc
- **Plan C**: Parc → Cafenea → Muzeu

### Senior (65 ani) - Duminică După-amiaza cu Familia:

- **Plan A**: Muzeu → Parc → Cafenea
- **Plan B**: Parc → Muzeu → Cafenea
- **Plan C**: Cafenea → Parc → Muzeu

## 🎯 **Beneficii**

- ✅ **Planuri Personalizate pe Vârstă**: Activități potrivite pentru fiecare grupă de vârstă
- ✅ **Experiență Multilingvă**: Mesaje în română și engleză
- ✅ **Identificare Vizuală**: Avatar personal pe hartă pentru localizare ușoară
- ✅ **Fallback Elegant**: Gestionare gracioasă a erorilor
- ✅ **Contextualitate Îmbunătățită**: Factori suplimentari în decizia de planificare

Aplicația acum oferă o experiență cu adevărat personalizată bazată pe vârsta, limba și profilul vizual al utilizatorului!
