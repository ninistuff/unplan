import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { Plan } from "./planTypes";

const STORAGE_KEY = "plans:favorites:v1";

export function keyForPlan(p: Plan): string {
  try {
    const names = (p.stops && p.stops.length > 0
      ? p.stops.map((s) => s.name)
      : (p.steps || []).filter((s: any) => (s as any).kind === 'poi').map((s: any) => (s as any).name)) as string[];
    return `${(names || []).join('|')}|${p.mode}`;
  } catch {
    return String(p.id ?? Math.random());
  }
}

async function loadMap(): Promise<Record<string, Plan>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch { return {}; }
}

async function saveMap(map: Record<string, Plan>) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}

export function useFavorites() {
  const [map, setMap] = useState<Record<string, Plan>>({});
  useEffect(() => { (async () => setMap(await loadMap()))(); }, []);

  const keys = useMemo(() => new Set(Object.keys(map)), [map]);
  const list = useMemo(() => Object.entries(map) as Array<[string, Plan]>, [map]);

  const toggle = useCallback(async (p: Plan) => {
    const k = keyForPlan(p);
    setMap((prev) => {
      const next = { ...prev } as Record<string, Plan>;
      if (next[k]) delete next[k]; else next[k] = p;
      saveMap(next);
      return next;
    });
  }, []);

  const remove = useCallback((k: string) => {
    setMap((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev } as Record<string, Plan>;
      delete next[k];
      saveMap(next);
      return next;
    });
  }, []);

  return { keys, list, toggle, remove, map };
}
