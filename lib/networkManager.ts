// lib/networkManager.ts - Robust Network Management
import { appStore } from "./store";

export type JsonPrimitive = string | number | boolean | null;
export type Json = JsonPrimitive | { [k: string]: Json } | Json[];

export type RequestBody =
  | string
  | URLSearchParams
  | FormData
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | { [k: string]: unknown };

// Network request configuration
interface RequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: RequestBody;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
}

// Response interface
interface NetworkResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached?: boolean;
}

// Error types
export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

// Network Manager Class
export class NetworkManager {
  private static instance: NetworkManager;
  private abortControllers: Map<string, AbortController> = new Map();
  private requestCache: Map<string, { data: unknown; timestamp: number }> = new Map();

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  // Main request method with retry logic and caching
  async request<T = any>(config: RequestConfig): Promise<NetworkResponse<T>> {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      timeout = appStore.getState().settings.requestTimeout,
      retries = appStore.getState().settings.maxRetries,
      cache = false,
      cacheKey = url,
    } = config;

    // Check cache first
    if (cache && method === "GET") {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        console.log(`[NetworkManager] Cache hit for ${url}`);
        return { ...cached, cached: true };
      }
    }

    // Create abort controller for this request
    const requestId = `${method}_${url}_${Date.now()}`;
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[NetworkManager] ${method} ${url} (attempt ${attempt + 1}/${retries + 1})`);

        const response = await this.makeRequest<T>({
          url,
          method,
          headers,
          body,
          timeout,
          signal: abortController.signal,
        });

        // Cache successful GET requests
        if (cache && method === "GET" && response.status >= 200 && response.status < 300) {
          this.setCachedResponse(cacheKey, response);
        }

        // Cleanup
        this.abortControllers.delete(requestId);

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort or certain errors
        if (error instanceof Error && error.name === "AbortError") {
          throw new NetworkError("Request aborted", 0, "ABORTED");
        }

        if (
          error instanceof NetworkError &&
          error.status &&
          error.status >= 400 &&
          error.status < 500
        ) {
          // Don't retry client errors
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`[NetworkManager] Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    // Cleanup and throw final error
    this.abortControllers.delete(requestId);
    throw lastError!;
  }

  // Make the actual HTTP request
  private async makeRequest<T>(config: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: RequestBody;
    timeout: number;
    signal: AbortSignal;
  }): Promise<NetworkResponse<T>> {
    const { url, method, headers, body, timeout, signal } = config;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new NetworkError("Request timeout", 0, "TIMEOUT")), timeout);
    });

    // Create fetch promise
    const fetchPromise = fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    try {
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Check if response is ok
      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          "HTTP_ERROR",
        );
      }

      // Parse response
      const data = await response.json();

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw error;
        }
        throw new NetworkError(`Network error: ${error.message}`, 0, "NETWORK_ERROR");
      }

      throw new NetworkError("Unknown network error", 0, "UNKNOWN_ERROR");
    }
  }

  // Cache management
  private getCachedResponse<T>(key: string): NetworkResponse<T> | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const { cacheTimeout } = appStore.getState().settings;
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;

    if (isExpired) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data as NetworkResponse<T>;
  }

  private setCachedResponse<T>(key: string, response: NetworkResponse<T>): void {
    this.requestCache.set(key, {
      data: response,
      timestamp: Date.now(),
    });
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Cancel specific request
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  // Clear cache
  clearCache(): void {
    this.requestCache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
    };
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();

// Convenience methods
export const api = {
  get: <T = any>(url: string, config?: Partial<RequestConfig>) =>
    networkManager.request<T>({ url, method: "GET", ...config }),

  post: <T = unknown>(url: string, data?: RequestBody, config?: Partial<RequestConfig>) =>
    networkManager.request<T>({ url, method: "POST", body: data, ...config }),

  put: <T = unknown>(url: string, data?: RequestBody, config?: Partial<RequestConfig>) =>
    networkManager.request<T>({ url, method: "PUT", body: data, ...config }),

  delete: <T = any>(url: string, config?: Partial<RequestConfig>) =>
    networkManager.request<T>({ url, method: "DELETE", ...config }),
};
