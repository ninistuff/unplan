// app/utils/useWeather.ts
import * as Location from "expo-location";
import { useEffect, useState } from "react";

type WeatherData = {
  city: string;
  temperature: number; // °C
  condition: "sunny" | "cloudy" | "rainy";
  lat: number;
  lon: number;
};

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        // numele orașului (opțional, dar nice)
        let city = "Locația ta";
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          const first = rev?.[0];
          if (first?.city) city = first.city;
          else if (first?.region) city = first.region;
        } catch {}

        // meteo actual de la Open-Meteo
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const json = await res.json();
        const cw = json?.current_weather;
        if (!cw) return;

        let condition: WeatherData["condition"] = "sunny";
        const code = Number(cw.weathercode);
        if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) condition = "rainy";
        else if ([1,2,3].includes(code)) condition = "cloudy";

        setData({
          city,
          temperature: Math.round(Number(cw.temperature)),
          condition,
          lat,
          lon,
        });
      } catch {
        // ignorăm erorile pentru prototip
      }
    })();
  }, []);

  return data;
}

