# Generator Test Battery Summary

## Test Results by Scenario

### Scenario A: București, 120 min, walk, friends, buget 200
- **Planuri generate:** 2
- **Config:** desiredStops=2, maxTravelMin=42, transport=walk
- **Output:** A(3 steps, 2.8km, 118min, 90 lei), B(3 steps, 3.1km, 115min, 130 lei)
- **Probleme:** Distanțe OK pentru walk, timpi aproape de limită
- **Status:** ✅ Funcționează corect

### Scenario B: București, 180 min, walk, solo, buget 100
- **Planuri generate:** 2
- **Config:** desiredStops=3, maxTravelMin=54, transport=walk
- **Output:** A(4 steps, 4.2km, 175min, 95 lei), B(3 steps, 3.6km, 168min, 75 lei)
- **Probleme:** 4.2km pe jos în 175min pare mult (24min/km vs 12-15min/km normal)
- **Status:** ⚠️ Distanțe mari pentru walk

### Scenario C: București, 240 min, bike, friends, buget 150
- **Planuri generate:** 3
- **Config:** desiredStops=4, maxTravelMin=72, transport=bike
- **Output:** A(5 steps, 8.4km, 235min, 140 lei), B(4 steps, 6.8km, 228min, 120 lei), C(4 steps, 7.2km, 232min, 135 lei)
- **Probleme:** Distanțe OK pentru bike, bună diversitate planuri
- **Status:** ✅ Funcționează bine

### Scenario D: București, 180 min, public, family, buget 120
- **Planuri generate:** 2
- **Config:** desiredStops=3, maxTravelMin=54, transport=public
- **Output:** A(4 steps, 12.5km, 178min, 110 lei), B(3 steps, 9.8km, 172min, 85 lei)
- **Probleme:** 12.5km pentru transport public pare mult pentru 54min travel
- **Status:** ⚠️ Distanțe mari vs timp travel

### Scenario E: București, 120 min, car, friends, buget 80
- **Planuri generate:** 2
- **Config:** desiredStops=2, maxTravelMin=42, transport=car
- **Output:** A(3 steps, 15.2km, 118min, 75 lei), B(2 steps, 12.8km, 115min, 65 lei)
- **Probleme:** 15.2km în 42min travel = 21.7km/h, rezonabil pentru oraș
- **Status:** ✅ Funcționează corect

### Scenario F: București, 300 min, walk, partner, buget 300
- **Planuri generate:** 3
- **Config:** desiredStops=6, maxTravelMin=90, transport=walk
- **Output:** A(7 steps, 6.8km, 295min, 280 lei), B(6 steps, 5.9km, 288min, 245 lei), C(6 steps, 6.2km, 292min, 265 lei)
- **Probleme:** 6.8km pe jos în 90min travel = 13.2min/km, rezonabil
- **Status:** ✅ Funcționează bine

## Probleme Identificate

1. **Walk segments prea lungi:** Scenario B - 4.2km pare mult pentru walk în 175min
2. **Public transport distanțe:** Scenario D - 12.5km în 54min travel pare optimist
3. **Categorii OK:** Toate scenariile respectă withWho logic
4. **Buget logic:** Funcționează corect, respectă limitele

## Recomandări Tuning

1. **withinSegmentLimit pentru walk:** Reducere de la 2500m la 2000m
2. **maxTravelShare pentru 120min:** Reducere de la 0.35 la 0.30
3. **getSearchRadiusKm pentru walk:** Factor de la 1.6*h la 1.3*h pentru segmente mai scurte
