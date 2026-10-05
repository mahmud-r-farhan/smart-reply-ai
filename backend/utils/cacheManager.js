import crypto from "crypto";
import { RedisCache } from "./redisClient.js";

/**
 * Production-Grade Multi-Tier Cache with LRU Eviction & Metrics
 * 
 * Supports:
 * 1. Fast in-memory LRU cache with TTL and maximum entry bounds (L1).
 * 2. Optional shared Redis tier (L2) so horizontally scaled replicas share
 *    warm results — enabled automatically when REDIS_URL is configured.
 * 3. Hit/Miss statistics and latency acceleration (serves in < 1ms).
 * 4. Graceful degradation: any L2 failure falls back to L1 + upstream calls.
 */
export class CacheManager {
  /**
   * @param {number} ttlMs - Time-to-live in milliseconds (default: 10 mins)
   * @param {number} maxEntries - Maximum keys stored before LRU eviction (default: 5,000)
   */
  /**
   * @param {number} ttlMs - Time-to-live in milliseconds (default: 10 mins)
   * @param {number} maxEntries - Maximum keys stored before LRU eviction (default: 5,000)
   * @param {object} [options]
   * @param {string|null} [options.redisUrl] Shared Redis URL (L2 tier)
   */
  constructor(ttlMs = 10 * 60 * 1000, maxEntries = 5000, { redisUrl = process.env.REDIS_URL || null } = {}) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;

    // Optional distributed tier (fails open to L1 when unreachable)
    this.distributed = redisUrl ? new RedisCache(redisUrl) : null;

    // Real-time cache metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      distributedHits: 0,
    };
  }

  /**
   * Read-through lookup used by the LLM service: L1 first, then the shared L2
   * tier. Never throws; a broken L2 behaves as a cache miss.
   */
  async getAsync(key) {
    const local = this.get(key);
    if (local !== null && local !== undefined) return local;
    if (!this.distributed) return null;

    const remote = await this.distributed.get(key);
    if (remote !== null && remote !== undefined) {
      this.metrics.distributedHits++;
      // Warm L1 so subsequent calls stay sub-millisecond.
      this.set(key, remote, Math.min(this.ttlMs, 60 * 1000));
      return remote;
    }
    return null;
  }

  /**
   * Write-through to both tiers. The L2 write is best-effort and never blocks
   * the request path longer than its timeout.
   */
  async setAsync(key, value, customTtlMs = null) {
    const ttl = customTtlMs ?? this.ttlMs;
    this.set(key, value, ttl);
    if (this.distributed) {
      await this.distributed.set(key, value, ttl);
    }
  }

  /**
   * Generate deterministic SHA-256 cache key
   */
  generateKey(prompt, context = "") {
    return crypto
      .createHash("sha256")
      .update(`${prompt}::${context}`)
      .digest("hex");
  }

  /**
   * Store entry with TTL and enforce LRU bound
   */
  set(key, value, customTtlMs = null) {
    if (!key || value === undefined) return;

    // Enforce LRU eviction if maximum capacity reached
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      // Oldest entry is the first key in Map insertion order
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.metrics.evictions++;
      }
    }

    const ttl = customTtlMs ?? this.ttlMs;
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
    this.metrics.sets++;
  }

  /**
   * Retrieve entry if valid and refresh LRU position
   */
  get(key) {
    if (!key) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    if (entry.expires > Date.now()) {
      this.metrics.hits++;
      // Re-insert to mark as most recently used
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }

    // Expired: prune immediately
    this.cache.delete(key);
    this.metrics.misses++;
    return null;
  }

  /**
   * Check existence without mutating stats
   */
  has(key) {
    const entry = this.cache.get(key);
    return !!entry && entry.expires > Date.now();
  }

  /**
   * Prune expired entries
   */
  prune() {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache) {
      if (entry.expires <= now) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Detailed cache telemetry and performance metrics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;

    for (const [, entry] of this.cache) {
      if (entry.expires > now) {
        validEntries++;
      }
    }

    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRatio = totalRequests > 0 
      ? Number(((this.metrics.hits / totalRequests) * 100).toFixed(2)) 
      : 0;

    return {
      size: this.cache.size,
      valid: validEntries,
      maxCapacity: this.maxEntries,
      ttlMinutes: Math.round(this.ttlMs / 60000),
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRatioPercent: hitRatio,
      evictions: this.metrics.evictions,
      sets: this.metrics.sets,
      distributedHits: this.metrics.distributedHits,
      distributedEnabled: Boolean(this.distributed),
      distributedAvailable: this.distributed ? this.distributed.enabled : false,
    };
  }
}

// Global shared cache instance. TTL / capacity / Redis URL are configurable
// through the environment for containerized deployments.
const ttlMs = Number(process.env.CACHE_TTL_MS) || 10 * 60 * 1000;
const maxEntries = Number(process.env.CACHE_MAX_ENTRIES) || 5000;

export default new CacheManager(ttlMs, maxEntries, {
  redisUrl: process.env.REDIS_URL || null,
});
