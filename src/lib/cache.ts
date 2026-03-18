// Smart localStorage cache with stale-while-revalidate pattern

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_VERSION = 1;
const PREFIX = "numba_";

// Default TTLs in milliseconds
const TTL = {
  accounts: 24 * 60 * 60 * 1000,    // 24 hours (rarely changes)
  receipts: 5 * 60 * 1000,           // 5 minutes
  transactions: 5 * 60 * 1000,       // 5 minutes
  dashboard: 2 * 60 * 1000,          // 2 minutes
  reports: 10 * 60 * 1000,           // 10 minutes
  user: 60 * 60 * 1000,              // 1 hour
} as const;

type CacheKey = keyof typeof TTL;

function getKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function cacheGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(getKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(getKey(key), JSON.stringify(entry));
  } catch {
    // localStorage full — clear old entries
    clearExpiredCache();
  }
}

export function cacheIsStale(key: string, category?: CacheKey): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(getKey(key));
    if (!raw) return true;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    const ttl = category ? TTL[category] : 5 * 60 * 1000;
    return Date.now() - entry.timestamp > ttl;
  } catch {
    return true;
  }
}

export function cacheInvalidate(keyOrPrefix: string): void {
  if (typeof window === "undefined") return;
  const fullPrefix = getKey(keyOrPrefix);
  const keys = Object.keys(localStorage).filter(k => k.startsWith(fullPrefix));
  keys.forEach(k => localStorage.removeItem(k));
}

export function clearExpiredCache(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
  keys.forEach(k => {
    try {
      const entry: CacheEntry<unknown> = JSON.parse(localStorage.getItem(k) || "");
      if (entry.version !== CACHE_VERSION || Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(k);
      }
    } catch {
      localStorage.removeItem(k);
    }
  });
}

/**
 * Smart fetch: returns cached data immediately, fetches fresh in background
 * Usage:
 *   const data = await cachedFetch("receipts_userId", "/api/receipts?userId=xxx", "receipts");
 */
export async function cachedFetch<T>(
  cacheKey: string,
  url: string,
  category: CacheKey,
  options?: RequestInit,
  onFresh?: (data: T) => void
): Promise<T | null> {
  const cached = cacheGet<T>(cacheKey);

  if (cached && !cacheIsStale(cacheKey, category)) {
    // Fresh cache — use it
    return cached;
  }

  if (cached) {
    // Stale cache — return it immediately, revalidate in background
    fetchAndCache<T>(cacheKey, url, options).then(fresh => {
      if (fresh && onFresh) onFresh(fresh);
    });
    return cached;
  }

  // No cache — must fetch
  return fetchAndCache<T>(cacheKey, url, options);
}

async function fetchAndCache<T>(
  cacheKey: string,
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const data = await res.json();
    cacheSet(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Invalidate related caches when data changes (e.g., new transaction created)
 */
export function invalidateAfterWrite(entity: "transaction" | "receipt" | "invoice" | "account") {
  switch (entity) {
    case "transaction":
      cacheInvalidate("transactions");
      cacheInvalidate("dashboard");
      cacheInvalidate("reports");
      break;
    case "receipt":
      cacheInvalidate("receipts");
      cacheInvalidate("dashboard");
      break;
    case "invoice":
      cacheInvalidate("invoices");
      cacheInvalidate("dashboard");
      break;
    case "account":
      cacheInvalidate("accounts");
      cacheInvalidate("reports");
      break;
  }
}
