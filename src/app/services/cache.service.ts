import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of items in cache
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export enum CacheStrategy {
  CACHE_FIRST = 'cache-first', // Return cached data if available, fetch if not
  NETWORK_FIRST = 'network-first', // Always fetch, fallback to cache on error
  CACHE_ONLY = 'cache-only', // Only return cached data
  NETWORK_ONLY = 'network-only', // Always fetch, never cache
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate' // Return cached data, fetch in background
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private cacheSubject = new BehaviorSubject<Map<string, CacheItem<any>>>(this.cache);
  public cache$ = this.cacheSubject.asObservable();

  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    cleanupInterval: 60 * 1000 // 1 minute
  };

  private cleanupTimer: any;

  constructor(private logger: LoggerService) {
    this.startCleanupTimer();
    this.logger.info('CacheService initialized', 'CacheService', this.config);
  }

  /**
   * Set cache item
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      // Check max size
      if (this.cache.size >= this.config.maxSize) {
        this.evictOldest();
      }

      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        key
      };

      this.cache.set(key, cacheItem);
      this.cacheSubject.next(this.cache);

      this.logger.debug('Cache item set', 'CacheService', {
        key,
        ttl: cacheItem.ttl,
        size: this.cache.size
      });
    } catch (error) {
      this.logger.error('Failed to set cache item', 'CacheService', error);
    }
  }

  /**
   * Get cache item
   */
  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);

      if (!item) {
        this.logger.debug('Cache miss', 'CacheService', { key });
        return null;
      }

      // Check if expired
      if (this.isExpired(item)) {
        this.logger.debug('Cache item expired', 'CacheService', { key });
        this.delete(key);
        return null;
      }

      this.logger.debug('Cache hit', 'CacheService', { key });
      return item.data as T;
    } catch (error) {
      this.logger.error('Failed to get cache item', 'CacheService', error);
      return null;
    }
  }

  /**
   * Get cache item with metadata
   */
  getWithMetadata<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    return item as CacheItem<T>;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache item
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.cacheSubject.next(this.cache);
      this.logger.debug('Cache item deleted', 'CacheService', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.cacheSubject.next(this.cache);
    this.logger.info('Cache cleared', 'CacheService');
  }

  /**
   * Clear cache by pattern
   */
  clearByPattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.cacheSubject.next(this.cache);
      this.logger.info(`Cleared ${count} cache items by pattern`, 'CacheService', {
        pattern: pattern.toString()
      });
    }

    return count;
  }

  /**
   * Get or set cache item
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch and cache data', 'CacheService', error);
      throw error;
    }
  }

  /**
   * Wrap Observable with cache
   */
  wrapObservable<T>(
    key: string,
    source$: Observable<T>,
    ttl?: number
  ): Observable<T> {
    return new Observable(observer => {
      // Try to get from cache first
      const cached = this.get<T>(key);

      if (cached !== null) {
        observer.next(cached);
        observer.complete();
        return;
      }

      // Subscribe to source
      const subscription = source$.subscribe({
        next: (data) => {
          this.set(key, data, ttl);
          observer.next(data);
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete()
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Invalidate cache by tags
   */
  private tags = new Map<string, Set<string>>();

  setWithTags<T>(key: string, data: T, tags: string[], ttl?: number): void {
    this.set(key, data, ttl);

    // Associate tags with key
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    });

    this.logger.debug('Cache item set with tags', 'CacheService', { key, tags });
  }

  invalidateByTag(tag: string): number {
    const keys = this.tags.get(tag);

    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });

    this.tags.delete(tag);
    this.logger.info(`Invalidated ${count} cache items by tag`, 'CacheService', { tag });

    return count;
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Evict oldest cache item
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.logger.debug('Evicted oldest cache item', 'CacheService', { key: oldestKey });
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    let count = 0;

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.cacheSubject.next(this.cache);
      this.logger.debug(`Cleaned up ${count} expired cache items`, 'CacheService');
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{ key: string; age: number; ttl: number }>;
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: Date.now() - item.timestamp,
      ttl: item.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // TODO: Track hits/misses
      items
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart cleanup timer with new interval
    if (config.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }

    this.logger.info('Cache config updated', 'CacheService', this.config);
  }

  /**
   * Export cache to JSON
   */
  export(): string {
    const data = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      data: item.data,
      timestamp: item.timestamp,
      ttl: item.ttl
    }));

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import cache from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      this.clear();

      data.forEach((item: any) => {
        this.set(item.key, item.data, item.ttl);
      });

      this.logger.info('Cache imported', 'CacheService', { items: data.length });
    } catch (error) {
      this.logger.error('Failed to import cache', 'CacheService', error);
    }
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}
