import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom log format with more details
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `${timestamp} [${level}]: ${message} `;
    
    // Add metadata if exists
    if (Object.keys(metadata).length > 0) {
      log += JSON.stringify(metadata);
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create base logger
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Extended logger with additional methods
export const extendedLogger = {
  error: (message: string, metadata?: any) => {
    baseLogger.error(message, metadata);
  },
  warn: (message: string, metadata?: any) => {
    baseLogger.warn(message, metadata);
  },
  info: (message: string, metadata?: any) => {
    baseLogger.info(message, metadata);
  },
  debug: (message: string, metadata?: any) => {
    baseLogger.debug(message, metadata);
  },
  // Security events
  security: (message: string, metadata?: any) => {
    baseLogger.info(`[SECURITY] ${message}`, metadata);
  },
  // Performance metrics
  performance: (operation: string, duration: number, metadata?: any) => {
    baseLogger.info(`[PERFORMANCE] ${operation} - ${duration}ms`, metadata);
  },
  // Database operations
  database: (operation: string, details: any) => {
    baseLogger.info(`[DATABASE] ${operation}`, details);
  },
  // Error with context
  errorWithContext: (error: Error | string, context?: any) => {
    const errorMessage = error instanceof Error ? error.message : error;
    baseLogger.error(errorMessage, { context, stack: error instanceof Error ? error.stack : undefined });
  }
};

// Uncaught exception and unhandled rejection handlers
process.on('uncaughtException', (error) => {
  extendedLogger.errorWithContext(error, { type: 'UncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  extendedLogger.errorWithContext('Unhandled Rejection', { reason, promise });
  process.exit(1);
});
