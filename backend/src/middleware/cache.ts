import { Request, Response, NextFunction } from 'express';
import RedisService from '../config/redis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  key?: string | ((req: Request) => string);
}

export const cache = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = RedisService.getInstance();
      
      // Generate cache key
      const cacheKey = typeof options.key === 'function'
        ? options.key(req)
        : options.key || `${req.method}:${req.originalUrl}`;

      // Try to get cached response
      const cachedResponse = await redis.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedResponse));
      }

      // Store original send method
      const originalSend = res.json;

      // Override send method to cache response
      res.json = function(body: any): Response {
        // Store in cache before sending
        redis.set(cacheKey, body, options.ttl)
          .catch(error => logger.error('Cache storage error:', error));

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};
