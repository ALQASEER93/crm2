import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// Extend the Request type to include the user payload from the JWT
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        roleId: number;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number; roleId: number };
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid JWT token received', { error: (error as Error).message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ message: 'Forbidden: User role not identified' });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
