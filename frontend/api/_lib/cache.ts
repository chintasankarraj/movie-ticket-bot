/**
 * Movie Ticket Bot — In-Memory Stale-While-Revalidate Cache
 * High-resilience cache layer preventing upstream GitHub rate limit exhaustion
 */

import { CACHE_CONFIG } from './config.js';
import { CacheStatus } from './types.js';

interface CacheRecord<T> {
  data: T;
  storedAt: number;
  ttlMs: number;
}

const memoryStore = new Map<string, CacheRecord<unknown>>();

export interface CacheLookupResult<T> {
  data: T;
  status: CacheStatus;
  ageMs: number;
}

export const memoryCache = {
  get<T>(key: string): CacheLookupResult<T> | null {
    const record = memoryStore.get(key) as CacheRecord<T> | undefined;
    if (!record) {
      return null;
    }

    const now = Date.now();
    const ageMs = now - record.storedAt;

    // Fresh
    if (ageMs < record.ttlMs) {
      return {
        data: record.data,
        status: 'HIT',
        ageMs,
      };
    }

    // Stale but within grace period
    if (ageMs < record.ttlMs + CACHE_CONFIG.MAX_STALE_MS) {
      return {
        data: record.data,
        status: 'STALE',
        ageMs,
      };
    }

    // Expired beyond grace period
    memoryStore.delete(key);
    return null;
  },

  set<T>(key: string, data: T, ttlMs: number = CACHE_CONFIG.DEFAULT_TTL_MS): void {
    if (data === null || data === undefined) {
      return;
    }
    memoryStore.set(key, {
      data,
      storedAt: Date.now(),
      ttlMs,
    });
  },

  /**
   * Retrieve existing stale data when an upstream call fails,
   * guaranteeing that a transient GitHub outage doesn't destroy last-known good data.
   */
  getFallbackOnFailure<T>(key: string): T | null {
    const record = memoryStore.get(key) as CacheRecord<T> | undefined;
    return record ? record.data : null;
  },

  clear(): void {
    memoryStore.clear();
  },
};
