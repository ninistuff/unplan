// lib/performanceMonitor.ts - Performance Monitoring and Optimization
import { useEffect, useRef } from 'react';
import { appStore } from './store';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Memory usage interface
interface MemoryUsage {
  timestamp: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  appState: {
    plans: number;
    cachedPOIs: number;
    usedPOIs: number;
  };
}

// Performance Monitor Class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private memorySnapshots: MemoryUsage[] = [];
  private maxMetricsHistory = 100;
  private maxMemorySnapshots = 50;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // Start timing a performance metric
  startTiming(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    this.metrics.set(name, metric);
    
    if (__DEV__) {
      console.log(`[Performance] Started timing: ${name}`);
    }
  }
  
  // End timing and calculate duration
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[Performance] No timing found for: ${name}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
    };
    
    // Add to completed metrics
    this.completedMetrics.unshift(completedMetric);
    
    // Limit history size
    if (this.completedMetrics.length > this.maxMetricsHistory) {
      this.completedMetrics = this.completedMetrics.slice(0, this.maxMetricsHistory);
    }
    
    // Remove from active metrics
    this.metrics.delete(name);
    
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  // Measure a function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }
  
  // Measure synchronous function execution time
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startTiming(name, metadata);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }
  
  // Take memory snapshot
  takeMemorySnapshot(): MemoryUsage {
    const timestamp = Date.now();
    const state = appStore.getState();
    
    let memoryInfo: any = {};
    
    // Get memory info if available (web only)
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      memoryInfo = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
    
    const snapshot: MemoryUsage = {
      timestamp,
      ...memoryInfo,
      appState: {
        plans: state.plans.length,
        cachedPOIs: state.poiCache.size,
        usedPOIs: state.usedPOIs.size,
      },
    };
    
    this.memorySnapshots.unshift(snapshot);
    
    // Limit snapshots
    if (this.memorySnapshots.length > this.maxMemorySnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(0, this.maxMemorySnapshots);
    }
    
    return snapshot;
  }
  
  // Get performance statistics
  getPerformanceStats(): {
    averageDuration: Record<string, number>;
    slowestOperations: PerformanceMetric[];
    totalOperations: number;
  } {
    const averageDuration: Record<string, number> = {};
    const operationGroups: Record<string, number[]> = {};
    
    // Group operations by name
    this.completedMetrics.forEach(metric => {
      if (metric.duration) {
        if (!operationGroups[metric.name]) {
          operationGroups[metric.name] = [];
        }
        operationGroups[metric.name].push(metric.duration);
      }
    });
    
    // Calculate averages
    Object.keys(operationGroups).forEach(name => {
      const durations = operationGroups[name];
      const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      averageDuration[name] = Math.round(average * 100) / 100;
    });
    
    // Get slowest operations
    const slowestOperations = [...this.completedMetrics]
      .filter(metric => metric.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);
    
    return {
      averageDuration,
      slowestOperations,
      totalOperations: this.completedMetrics.length,
    };
  }
  
  // Get memory usage trends
  getMemoryTrends(): {
    current: MemoryUsage | null;
    peak: MemoryUsage | null;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.memorySnapshots.length === 0) {
      return { current: null, peak: null, trend: 'stable' };
    }
    
    const current = this.memorySnapshots[0];
    const peak = this.memorySnapshots.reduce((max, snapshot) => {
      const currentUsage = snapshot.usedJSHeapSize || 0;
      const maxUsage = max.usedJSHeapSize || 0;
      return currentUsage > maxUsage ? snapshot : max;
    });
    
    // Determine trend (compare last 5 snapshots)
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memorySnapshots.length >= 5) {
      const recent = this.memorySnapshots.slice(0, 5);
      const first = recent[recent.length - 1].usedJSHeapSize || 0;
      const last = recent[0].usedJSHeapSize || 0;
      const change = (last - first) / first;
      
      if (change > 0.1) trend = 'increasing';
      else if (change < -0.1) trend = 'decreasing';
    }
    
    return { current, peak, trend };
  }
  
  // Check for performance issues
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    const stats = this.getPerformanceStats();
    const memoryTrends = this.getMemoryTrends();
    
    // Check for slow operations
    Object.entries(stats.averageDuration).forEach(([name, duration]) => {
      if (duration > 2000) {
        issues.push(`Slow operation: ${name} averages ${duration.toFixed(2)}ms`);
      }
    });
    
    // Check memory trends
    if (memoryTrends.trend === 'increasing') {
      issues.push('Memory usage is increasing - possible memory leak');
    }
    
    // Check app state size
    const state = appStore.getState();
    if (state.poiCache.size > 100) {
      issues.push(`Large POI cache: ${state.poiCache.size} entries`);
    }
    
    if (state.usedPOIs.size > 1000) {
      issues.push(`Large used POIs set: ${state.usedPOIs.size} entries`);
    }
    
    return issues;
  }
  
  // Clear all metrics and snapshots
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
    this.memorySnapshots = [];
  }
  
  // Start automatic monitoring
  startAutoMonitoring(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.takeMemorySnapshot();
      
      const issues = this.checkPerformanceIssues();
      if (issues.length > 0 && __DEV__) {
        console.warn('[Performance] Issues detected:', issues);
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const startTiming = (name: string, metadata?: Record<string, any>) =>
  performanceMonitor.startTiming(name, metadata);

export const endTiming = (name: string) =>
  performanceMonitor.endTiming(name);

export const measureAsync = <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>) =>
  performanceMonitor.measureAsync(name, fn, metadata);

export const measure = <T>(name: string, fn: () => T, metadata?: Record<string, any>) =>
  performanceMonitor.measure(name, fn, metadata);

// React hook for performance monitoring

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    
    if (__DEV__ && renderCount.current > 10) {
      console.warn(`[Performance] ${componentName} has re-rendered ${renderCount.current} times`);
    }
  });
  
  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    if (__DEV__ && mountDuration > 100) {
      console.warn(`[Performance] ${componentName} took ${mountDuration}ms to mount`);
    }
    
    return () => {
      const totalLifetime = Date.now() - mountTime.current;
      if (__DEV__) {
        console.log(`[Performance] ${componentName} lifetime: ${totalLifetime}ms, renders: ${renderCount.current}`);
      }
    };
  }, [componentName]);
  
  return {
    renderCount: renderCount.current,
    startTiming: (name: string) => startTiming(`${componentName}.${name}`),
    endTiming: (name: string) => endTiming(`${componentName}.${name}`),
  };
}
