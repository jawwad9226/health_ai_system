import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Create Winston logger instance
const logger = winston.createLogger({
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
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Define request logger options interface
interface RequestLoggerOptions {
  excludePaths?: string[];
  logBody?: boolean;
  logQuery?: boolean;
  logHeaders?: boolean;
}

// Create request logger middleware
export function createRequestLogger(options: RequestLoggerOptions = {}) {
  const {
    excludePaths = [],
    logBody = true,
    logQuery = true,
    logHeaders = false
  } = options;

  return function requestLogger(req: Request, res: Response, next: NextFunction) {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Generate unique request ID
    const requestId = uuidv4();
    res.locals.requestId = requestId;

    // Capture request start time
    const startTime = Date.now();

    // Create log entry
    const logEntry = {
      requestId,
      method: req.method,
      path: req.path,
      query: logQuery ? req.query : undefined,
      body: logBody ? req.body : undefined,
      headers: logHeaders ? req.headers : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Log request
    logger.info('Incoming request', logEntry);

    // Capture response data
    const originalSend = res.send.bind(res);
    res.send = function(body: unknown): Response {
      const responseTime = Date.now() - startTime;

      // Log response
      logger.info('Response sent', {
        requestId,
        statusCode: res.statusCode,
        responseTime,
        contentLength: res.get('content-length')
      });

      return originalSend(body);
    };

    // Handle errors
    const errorHandler = (err: Error) => {
      logger.error('Request error', {
        requestId,
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
