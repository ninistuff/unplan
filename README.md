[![CI](https://github.com/ninistuff/unplan/actions/workflows/ci.yml/badge.svg)](https://github.com/ninistuff/unplan/actions/workflows/ci.yml)

# Welcome to your Expo app

## Platforme suportate

Android. iOS. Web în plan. Testarea curentă se face pe emulator Android și pe device-uri reale.

## Setup reproductibil

Node 20 LTS. NPM 10. Expo CLI global.

### Instalare
```bash
npm install
```

### Rulare
```bash
npm start
```

### Android
Pornește un emulator din Android Studio. Apasă `a` în Expo.

### iOS
Necesită macOS și Xcode. Apasă `i` în Expo.

### Variabile
Copiază `.env.example` în `.env`. Ajustează URL-urile dacă folosești instanțe proprii.

## Permisiuni și refuz

**Locație.** Se cere pe Home la primul acces. Dacă refuzi, Home arată un buton pentru retrimiterea permisiunii și opțiunea Alege oraș manual. Results generează planuri fără poziție exactă.

**Date.** Nu salvăm PII în repo. Rezultatele se păstrează doar local pe sesiune.

## Limite API și retry

**Overpass.** Limită variabilă de trafic. Timeout 12s. Retry cu backoff 1s, 2s, 4s.

**OSRM public.** Fără SLA. Timeout 8s. Un singur retry la 2s. Dacă pică, estimăm distanța cu Haversine.

**Open-Meteo.** Stabil. Timeout 8s. Fallback pe condiție unknown.

## Caching

Rezultate intermediare stocate în memorie pe durata sesiunii, POI și meteo.

Invalidare la schimbarea orașului sau după 15 minute.

Nu scriem pe disc. Nu există sincronizare remote.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Permissions

The app requests foreground location permission to:

- Fetch your approximate city for weather and nearby places
- Center plans around your current position

You can continue without granting location, and the app falls back to Bucharest.

## Public Transport (optional)

If you run an OpenTripPlanner (OTP) instance, you can enable public transport routing for the first legs between POIs.

- Set an environment variable with your OTP base URL when starting Metro:

  - `OTP_BASE_URL` or `EXPO_PUBLIC_OTP_BASE_URL`

  Example: `EXPO_PUBLIC_OTP_BASE_URL=https://your-otp-host` then `npx expo start`

When the variable is not defined, the app falls back gracefully to walking/biking segments.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

