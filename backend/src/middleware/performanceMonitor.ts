import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Create Winston logger instance for performance monitoring
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/performance.log'
    })
  ]
});

// Define performance monitor options interface
interface PerformanceMonitorOptions {
  slowRequestThreshold?: number;
  excludePaths?: string[];
  enableMemoryTracking?: boolean;
}

// Create performance monitor middleware
export function createPerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    slowRequestThreshold = 1000,
    excludePaths = [],
    enableMemoryTracking = false
  } = options;

  return function performanceMonitor(req: Request, res: Response, next: NextFunction) {
    // Skip monitoring for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Generate unique request ID
    const requestId = uuidv4();
    res.locals.requestId = requestId;

    // Capture request start time and initial memory usage
    const startTime = process.hrtime();
    const startMemory = enableMemoryTracking ? process.memoryUsage() : null;

    // Create base log entry
    const baseLogEntry = {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Log request start
    performanceLogger.info('Request started', baseLogEntry);

    // Capture response data
    const originalSend = res.send.bind(res);
    res.send = function(body: unknown): Response {
      // Calculate duration
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      // Create performance log entry
      const performanceEntry = {
        ...baseLogEntry,
        statusCode: res.statusCode,
        duration,
        slowRequest: duration > slowRequestThreshold
      };

      // Add memory metrics if enabled
      if (enableMemoryTracking && startMemory) {
        const endMemory = process.memoryUsage();
        performanceEntry['memory'] = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          rss: endMemory.rss - startMemory.rss
        };
      }

      // Log performance data
      if (duration > slowRequestThreshold) {
        performanceLogger.warn('Slow request detected', performanceEntry);
      } else {
        performanceLogger.info('Request completed', performanceEntry);
      }

      return originalSend(body);
    };

    // Handle errors
    const errorHandler = (err: Error) => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      performanceLogger.error('Request error', {
        ...baseLogEntry,
        duration,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      });
    };

    res.on('error', errorHandler);
    req.on('error', errorHandler);

    next();
  };
}

// Export helper functions for testing
export function getPerformanceLogger() {
  return performanceLogger;
}

// Function to periodically log system-wide performance
export const logSystemPerformance = () => {
  const logInterval = 5 * 60 * 1000; // 5 minutes

  const performanceLog = () => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    performanceLogger.info('System Performance', 0, {
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    });
  };

  // Log performance every 5 minutes
  setInterval(performanceLog, logInterval);
};
