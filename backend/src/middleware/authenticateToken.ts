import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { extendedLogger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
    permissions?: string[];
  };
}

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as {
      userId: string;
      username: string;
      role: string;
      permissions?: string[];
    };

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      extendedLogger.error('JWT Verification Error:', error);
      next(new AppError(401, 'Invalid or expired token'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      extendedLogger.error('Unexpected authentication error:', error);
      next(new AppError(500, 'Authentication error'));
    }
  }
};

export default authenticateToken;
