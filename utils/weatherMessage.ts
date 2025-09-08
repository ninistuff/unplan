// utils/weatherMessage.ts

export type SimpleCond = "sunny" | "cloudy" | "rainy";

export function buildWeatherMessage(
  tempC: number,
  cond: SimpleCond,
  hour: number,
  weekday: number // 0=Sun .. 6=Sat
) {
  const utilParts: string[] = [];

  // temperature-based
  if (tempC < 10) utilParts.push("Ia o geacă.");
  if (cond === "rainy") utilParts.push("Umbrelă, te rog.");
  if (tempC >= 28) utilParts.push("Ia niște apă și dă-te cu SPF.");

  // metro closing info: Mon-Thu (1..4) and Fri (5)
  if (weekday >= 1 && weekday <= 5) {
    utilParts.push("Închide la metrou la 23:30.");
  }

  // If nothing triggered, provide a minimal helpful line
  if (utilParts.length === 0) {
    utilParts.push(tempC >= 18 ? "Hanorac subțire e ok." : "Mai pune un strat.");
  }

  // fun
  let fun = "";
  const isEvening = hour >= 18;
  const isFriOrSat = weekday === 5 || weekday === 6; // 5=Fri, 6=Sat
  const isRain = cond === "rainy";

  if (isFriOrSat && isEvening && !isRain) {
    fun = "Plouă cu distracție :)";
  } else if (isEvening && !isRain) {
    fun = "O plimbare?";
  } else if (cond === "cloudy" && hour < 18) {
    fun = "Nu e vară, but that's ok.";
  }

  const util = utilParts.join(" ");
  return fun ? `${util} ${fun}` : util;
}

