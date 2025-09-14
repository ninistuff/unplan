// lib/store.ts - Centralized State Management (Simple Implementation)
import { useEffect, useState } from 'react';
import type { LatLng, Plan, POI } from './planTypes';

// Simple State Management without external dependencies
interface AppState {
  userLocation: LatLng | null;
  plans: Plan[];
  poiCache: Map<string, POI[]>;
  isGeneratingPlans: boolean;
  isLoadingPOIs: boolean;
  lastError: string | null;
  usedPOIs: Set<string>;
  settings: {
    cacheTimeout: number;
    maxRetries: number;
    requestTimeout: number;
  };
}

// Global state instance
class AppStore {
  private state: AppState = {
    userLocation: null,
    plans: [],
    poiCache: new Map(),
    isGeneratingPlans: false,
    isLoadingPOIs: false,
    lastError: null,
    usedPOIs: new Set(),
    settings: {
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
      maxRetries: 3,
      requestTimeout: 10000, // 10 seconds
    },
  };

  private listeners: Set<() => void> = new Set();

  // Subscribe to state changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  // Get current state
  getState(): AppState {
    return { ...this.state };
  }

  // User Location
  setUserLocation(location: LatLng | null): void {
    this.state.userLocation = location;
    this.notify();
  }

  // Plans
  setPlans(plans: Plan[]): void {
    this.state.plans = plans;
    this.notify();
  }

  clearPlans(): void {
    this.state.plans = [];
    this.notify();
  }

  // POI Cache
  setPOICache(key: string, pois: POI[]): void {
    this.state.poiCache.set(key, pois);
    this.notify();
  }

  clearPOICache(): void {
    this.state.poiCache.clear();
    this.notify();
  }

  // Loading States
  setGeneratingPlans(loading: boolean): void {
    this.state.isGeneratingPlans = loading;
    this.notify();
  }

  setLoadingPOIs(loading: boolean): void {
    this.state.isLoadingPOIs = loading;
    this.notify();
  }

  // Error States
  setError(error: string | null): void {
    this.state.lastError = error;
    this.notify();
  }

  clearError(): void {
    this.state.lastError = null;
    this.notify();
  }

  // Diversity Management
  addUsedPOI(poiId: string): void {
    this.state.usedPOIs.add(poiId);
    this.notify();
  }

  clearUsedPOIs(): void {
    this.state.usedPOIs.clear();
    this.notify();
  }

  // Settings
  updateSettings(newSettings: Partial<AppState['settings']>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.notify();
  }
}

// Global store instance
export const appStore = new AppStore();

// React hooks for using the store

export function useAppState<T>(selector: (state: AppState) => T): T {
  const [value, setValue] = useState(() => selector(appStore.getState()));

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setValue(selector(appStore.getState()));
    });
    return unsubscribe;
  }, [selector]);

  return value;
}

// Specific hooks for common use cases
export const useUserLocation = () => useAppState(state => state.userLocation);
export const usePlans = () => useAppState(state => state.plans);
export const useLoadingStates = () => useAppState(state => ({
  isGeneratingPlans: state.isGeneratingPlans,
  isLoadingPOIs: state.isLoadingPOIs,
}));
export const useAppError = () => useAppState(state => state.lastError);

// Actions object for easy access
export const planActions = {
  setPlans: (plans: Plan[]) => appStore.setPlans(plans),
  clearPlans: () => appStore.clearPlans(),
  setGeneratingPlans: (loading: boolean) => appStore.setGeneratingPlans(loading),
  setError: (error: string | null) => appStore.setError(error),
  clearError: () => appStore.clearError(),
};

// Cache Management
export class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  private getCacheKey(lat: number, lon: number, radius: number): string {
    return `poi_${Math.round(lat * 1000)}_${Math.round(lon * 1000)}_${radius}`;
  }
  
  getCachedPOIs(lat: number, lon: number, radius: number): POI[] | null {
    const key = this.getCacheKey(lat, lon, radius);
    const cache = appStore.getState().poiCache;
    return cache.get(key) || null;
  }

  setCachedPOIs(lat: number, lon: number, radius: number, pois: POI[]): void {
    const key = this.getCacheKey(lat, lon, radius);
    appStore.setPOICache(key, pois);
  }

  clearCache(): void {
    appStore.clearPOICache();
  }
}

// Cleanup utility for memory management
export const cleanup = {
  clearAll: () => {
    appStore.clearPlans();
    appStore.clearPOICache();
    appStore.clearUsedPOIs();
    appStore.clearError();
  },

  clearSession: () => {
    appStore.clearUsedPOIs();
    appStore.clearError();
  }
};

// Performance monitoring
export const performance = {
  startTimer: (name: string) => {
    console.time(`[Performance] ${name}`);
  },

  endTimer: (name: string) => {
    console.timeEnd(`[Performance] ${name}`);
  },

  logMemoryUsage: () => {
    if (__DEV__) {
      const state = appStore.getState();
      console.log('[Performance] Memory Usage:', {
        plans: state.plans.length,
        cachedPOIs: state.poiCache.size,
        usedPOIs: state.usedPOIs.size,
      });
    }
  }
};
