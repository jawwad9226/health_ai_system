import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  retryStrategy?: (times: number) => number | void;
}

const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.debug(`Redis connection retry in ${delay}ms`);
    return delay;
  },
};

/**
 * RedisService class implementing the Singleton pattern for Redis connections
 */
export class RedisService {
  private static instance: RedisService;
  private client: Redis;

  private constructor() {
    this.client = new Redis(redisConfig);

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  // Cache methods
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  public async setHash(hash: string, key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hset(hash, key, serializedValue);
    } catch (error) {
      logger.error('Redis hash set error:', error);
      throw error;
    }
  }

  public async getHash(hash: string, key: string): Promise<any> {
    try {
      const value = await this.client.hget(hash, key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis hash get error:', error);
      throw error;
    }
  }

  public async delHash(hash: string, key: string): Promise<void> {
    try {
      await this.client.hdel(hash, key);
    } catch (error) {
      logger.error('Redis hash delete error:', error);
      throw error;
    }
  }

  // List operations
  public async pushToList(key: string, value: any): Promise<number> {
    try {
      return await this.client.lpush(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis pushToList error:', error);
      throw error;
    }
  }

  public async getList(key: string, start: number = 0, stop: number = -1): Promise<any[]> {
    try {
      const items = await this.client.lrange(key, start, stop);
      return items.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Redis getList error:', error);
      throw error;
    }
  }

  // Set operations
  public async addToSet(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.sadd(key, serializedValue);
    } catch (error) {
      logger.error('Redis set add error:', error);
      throw error;
    }
  }

  public async getSet(key: string): Promise<any[]> {
    try {
      const set = await this.client.smembers(key);
      return set.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Redis set get error:', error);
      throw error;
    }
  }

  // Cache clearing
  public async clearCache(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      logger.error('Redis cache clear error:', error);
      throw error;
    }
  }

  public async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      logger.debug('Redis cache flushed');
    } catch (error) {
      logger.error('Redis flushAll error:', error);
      throw error;
    }
  }
}

export default RedisService;
