import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheDBService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async set<T>(key: string, value: T, ttl = -1) {
    if (ttl === -1) {
      return this.cacheManager.set(key, value);
    } else {
      return this.cacheManager.set(key, value, {
        ttl,
      });
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    const val = await this.cacheManager.get<T>(key);
    if (val) {
      return val;
    } else {
      return defaultValue;
    }
  }

  async getKeys(): Promise<string[]> {
    return this.cacheManager.store.keys<string>();
  }

  async del(key: string) {
    return this.cacheManager.del(key);
  }

  getCacheManager(): Cache {
    return this.cacheManager;
  }
}
