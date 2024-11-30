import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';
import { ROLES } from '../models/User';

interface JwtPayload {
  userId: string;
  username: string;
  role: keyof typeof ROLES;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// The main auth middleware factory function
export const auth = (requiredRoles?: (keyof typeof ROLES)[], requiredPermissions?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as JwtPayload;

      // Role-based authorization
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.includes(decoded.role);
        if (!hasRequiredRole) {
          logger.warn(`Unauthorized access attempt by ${decoded.username} with role ${decoded.role}`);
          throw new AppError(403, 'Insufficient role permissions');
        }
      }

      // Permission-based authorization
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(
          permission => decoded.permissions?.includes(permission)
        );
        
        if (!hasRequiredPermissions) {
          logger.warn(`Unauthorized access attempt by ${decoded.username} lacking permissions`);
          throw new AppError(403, 'Insufficient specific permissions');
        }
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('JWT Verification Error:', error);
        next(new AppError(401, 'Invalid or expired token'));
      } else if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Unexpected authentication error:', error);
        next(new AppError(500, 'Authentication error'));
      }
    }
  };
};

// Export auth as the default middleware for backward compatibility
export const authMiddleware = auth;

// Helper function to check if a user has a specific permission
export const hasPermission = (user: JwtPayload, permission: string): boolean => {
  return user.permissions?.includes(permission) || false;
};
