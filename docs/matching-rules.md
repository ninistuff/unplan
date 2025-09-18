# Reguli de potrivire (generator real)

- Intrări obligatorii
  - Locație curentă: lat, lon, oraș
  - Vreme: prognoză pe ore (6–12h) din Open‑Meteo
  - Ora locală (ISO)
  - Parametri UI: durată (minute), transport (walk/public/car/bike), buget (număr sau ∞), cu cine (friends/family/partner/pet)

- Număr de opriri după durată
  - 30–120 min → 1 oprire
  - 121–240 min → 2 opriri
  - 241–360 min → 2–3 opriri
  - 361–480 min → 3–4 opriri
  - 481–600 min → 3–5 opriri
  - 601–720 min → 4–6 opriri

- Timp pe drum
  - Maxim 25–35% din durata totală; dacă depășește, taie opriri din coadă până încape

- Transport (constrângeri)
  - Walk: 0.5–1.5 km între opriri; grupează în aceeași zonă
  - Bike: 1–5 km între opriri
  - Public: maxim 1–2 schimburi în total (în V1 aproximăm prin distanțe/număr opriri)
  - Car: ~20–30 min per segment în oraș (V1 aproximăm cu viteză urbană)

- Vreme (ordinea și filtrarea)
  - Ploaie în ≤2h (prob. >50%): indoor prioritar; pe Home mesaj „ia umbrela”
  - Caniculă (feels like ≥35°C): indoor + hidratare; evită plimbări lungi
  - Vânt puternic: evită bike

- Ora locală (ferestre recomandate)
  - 07–11: activități fizice, mic dejun, cafenele, locații deschise devreme
  - 11–17: muzee, galerii, restaurante, parcuri cu nume
  - 17–24: wine bar, craft beer, rooftop, cinema, escape, arcade
  - 00–07: fără baruri; dacă nu sunt opțiuni, mesaj de așteptare

- Filtrare OSM
  - Doar locuri cu tag `name` (≥3 caractere) – nume real; fără „Unnamed”
  - Categorii permise (extensie graduală): cafe, restaurant, fast_food, tea_room (dacă există), bar, pub, cinema, library, museum, gallery, zoo, aquarium, attraction, fitness_centre, sports_centre, bowling_alley, escape_game, swimming_pool, climbing (indoor), arcade, karaoke, spa
  - Preferă POI cu website/brand/wikidata când există
  - Exclude: cimitir, forest, meadow, grass, greenfield, construction, industrial, farmland, spațiu verde generic
  - Rază implicită 2–4 km în oraș, extinde la 8–12 km când nu sunt suficiente opțiuni potrivite
  - Respectă `opening_hours` când există (V1: 24/7 și intervale simple); altfel marchează „necunoscut” și propune în ferestre rezonabile

- Compoziție plan (3 planuri distincte)
  - Respectă toate setările (durată, transport, buget, cu cine, vreme, oră)
  - Include timpul pe drum între activități; nu depăși durata totală
  - Durate implicite: cafea 45–60 min; film 90–120 min; muzeu 30–60 min; plimbare 30–60 min
  - Vremea decide ordinea: dacă plouă în 2h → outdoor scurt apoi indoor
  - Walk: segmente 0.5–1.5 km; Bike: 1–5 km; Public: max 1–2 schimburi; Car: 20–30 min/segment
  - Buget: estimează pe oprire; nu depăși totalul; „necunoscut” când lipsesc date
  - Extinde aria când durata permite (6–12h); nu te limita la proximitate

- Criterii de acceptare
  - Planul nu depășește durata; include timpii pe drum
  - Fiecare oprire are nume real (fără „Unnamed”), fără cimitir/spații verzi generice
  - Ordine conform vremii; distanțe realiste; buget ≤ total; necunoscutele marcate
