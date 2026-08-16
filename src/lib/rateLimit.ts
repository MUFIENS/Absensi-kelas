/**
 * Rate Limiter Engine with Composite Key Throttling
 * Prevents NAT / School WiFi collisions by scoping throttles to IP + Identifier (NIS/Username).
 * Supports pluggable storage adapters (LocalStorage for client, InMemory for test/dev, Redis for backend).
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // e.g. 60000 ms (1 minute)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitRecord | null;
  set(key: string, record: RateLimitRecord, ttlMs: number): void;
}

// In-Memory Storage Adapter (for Node.js testing / Edge runtime)
export class InMemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, RateLimitRecord>();

  get(key: string): RateLimitRecord | null {
    return this.map.get(key) || null;
  }

  set(key: string, record: RateLimitRecord): void {
    this.map.set(key, record);
  }

  clear(): void {
    this.map.clear();
  }
}

// LocalStorage Storage Adapter (Persistent across client browser refreshes)
export class LocalStorageRateLimitStore implements RateLimitStore {
  private prefix = "absensi_ratelimit_";

  get(key: string): RateLimitRecord | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  set(key: string, record: RateLimitRecord): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(record));
    } catch (e) {
      console.warn("Rate limit storage write error:", e);
    }
  }
}

export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config;
    if (store) {
      this.store = store;
    } else if (typeof window !== "undefined") {
      this.store = new LocalStorageRateLimitStore();
    } else {
      this.store = new InMemoryRateLimitStore();
    }
  }

  /**
   * Evaluates request against rate limit.
   * @param clientIp Client IP address
   * @param identifier Unique account/session identifier (e.g. NIS or Username)
   */
  check(clientIp: string = "client", identifier: string = "global"): RateLimitResult {
    const compositeKey = `${clientIp.trim()}:${identifier.trim().toLowerCase()}`;
    const now = Date.now();
    const existing = this.store.get(compositeKey);

    if (!existing || now - existing.firstRequestTime > this.config.windowMs) {
      // New window
      const newRecord: RateLimitRecord = { count: 1, firstRequestTime: now };
      this.store.set(compositeKey, newRecord, this.config.windowMs);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTimeMs: now + this.config.windowMs,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= this.config.maxRequests) {
      const resetTimeMs = existing.firstRequestTime + this.config.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs,
        retryAfterSeconds,
      };
    }

    // Increment count
    existing.count += 1;
    this.store.set(compositeKey, existing, this.config.windowMs);
    const resetTimeMs = existing.firstRequestTime + this.config.windowMs;

    return {
      allowed: true,
      remaining: this.config.maxRequests - existing.count,
      resetTimeMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Resets rate limit record upon successful authentication
   */
  reset(clientIp: string = "client", identifier: string = "global"): void {
    const compositeKey = `${clientIp.trim()}:${identifier.trim().toLowerCase()}`;
    this.store.set(compositeKey, { count: 0, firstRequestTime: 0 }, 0);
  }
}

// Preconfigured Singletons
export const loginRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 attempts per window
  windowMs: 60 * 1000, // 1 minute
});

export const qrSubmitRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});
