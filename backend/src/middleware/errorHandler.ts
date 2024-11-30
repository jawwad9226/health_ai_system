import { Request, Response, NextFunction } from 'express';
import { extendedLogger } from '../utils/logger';

// Custom error class for application-specific errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number, 
    message: string, 
    isOperational: boolean = true,
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Centralized error handler middleware
export const errorHandler = (
  err: Error | AppError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default to 500 internal server error if not an AppError
  const statusCode = err instanceof AppError 
    ? err.statusCode 
    : 500;

  // Prepare error response
  const errorResponse = {
    status: 'error',
    statusCode,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack 
    })
  };

  // Log the error
  if (statusCode >= 500) {
    extendedLogger.errorWithContext('Server Error', {
      method: req.method,
      path: req.path,
      body: req.body,
      error: err
    });
  } else if (statusCode >= 400) {
    extendedLogger.security('Client Error', {
      method: req.method,
      path: req.path,
      body: req.body,
      error: err
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to simplify error handling in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const validationErrorHandler = (errors: any[]) => {
  const formattedErrors = errors.map(err => ({
    field: err.path,
    message: err.msg
  }));

  throw new AppError(400, 'Validation Error', true, JSON.stringify(formattedErrors));
};
