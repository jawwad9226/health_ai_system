import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import RedisService from '../config/redis';
import { AppError } from './errorHandler';
import { extendedLogger } from '../utils/logger';
import config from '../utils/config';
import { AuthenticatedRequest } from './authenticateToken';

// Rate limiter configuration
const getRateLimiterConfig = (type: 'api' | 'auth' | 'upload' | 'session') => {
  const baseConfig = {
    storeClient: RedisService.getInstance().getClient(),
    blockDuration: 60 * 15, // 15 minutes block
    keyPrefix: `ratelimit_${type}`
  };

  switch (type) {
    case 'api':
      return {
        ...baseConfig,
        points: config.get('features').enableRateLimiting ? 100 : 1000,
        duration: 60 // Per minute
      };
    case 'auth':
      return {
        ...baseConfig,
        points: 5, // 5 attempts
        duration: 60 * 15, // Per 15 minutes
        blockDuration: 60 * 60 // 1 hour block after repeated failures
      };
    case 'upload':
      return {
        ...baseConfig,
        points: 10, // 10 uploads
        duration: 60 * 60 // Per hour
      };
    case 'session':
      return {
        ...baseConfig,
        points: 20, // 20 session operations
        duration: 60 * 5 // Per 5 minutes
      };
    default:
      return {
        ...baseConfig,
        points: 100,
        duration: 60
      };
  }
};

// Create rate limiters
const apiLimiter = new RateLimiterRedis(getRateLimiterConfig('api'));
const authLimiter = new RateLimiterRedis(getRateLimiterConfig('auth'));
const uploadLimiter = new RateLimiterRedis(getRateLimiterConfig('upload'));
const sessionLimiter = new RateLimiterRedis(getRateLimiterConfig('session'));

// Enhanced rate limiter middleware
export const rateLimiter = (type: 'api' | 'auth' | 'upload' | 'session' = 'api') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if disabled
    if (!config.get('features').enableRateLimiting) {
      return next();
    }

    try {
      const limiter = type === 'auth' ? authLimiter : 
                     type === 'upload' ? uploadLimiter :
                     type === 'session' ? sessionLimiter : 
                     apiLimiter;

      // Use a composite key with IP and user ID if available
      const getUserIdentifier = (req: Request): string => {
        // Get user ID from authenticated request or use IP address as fallback
        const userId = (req as AuthenticatedRequest).user?.userId || req.ip || 'unknown';
        return userId.toString();
      };

      const key = getUserIdentifier(req);
      
      await limiter.consume(key);
      next();
    } catch (error) {
      // Log rate limit events
      extendedLogger.security('Rate Limit Exceeded', {
        ip: req.ip,
        type,
        userAgent: req.get('User-Agent')
      });

      // Handle rate limit errors
      if (error instanceof Error) {
        next(new AppError(429, 'Too Many Requests'));
      } else {
        const rateLimiterRes = error as RateLimiterRes;
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;
        
        res.set('Retry-After', String(retryAfter));
        next(new AppError(429, `Too Many Requests. Try again in ${retryAfter} seconds`));
      }
    }
  };
};

// Specialized rate limiters for different routes
export const apiRateLimiter = rateLimiter('api');
export const authRateLimiter = rateLimiter('auth');
export const uploadRateLimiter = rateLimiter('upload');
export const sessionRateLimiter = rateLimiter('session');
