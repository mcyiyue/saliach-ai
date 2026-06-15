import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-this';

// Middleware to verify JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check RBAC permissions
export const requirePermission = (requiredRoute: string, action: 'read' | 'write' = 'read') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      // Find the module based on routePath
      const module = await prisma.module.findFirst({
        where: { routePath: requiredRoute },
      });

      if (!module) {
        res.status(404).json({ message: 'Module not found for this route' });
        return;
      }

      // Check if user has permission through their group
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { groupId: true },
      });

      if (!user || !user.groupId) {
        res.status(403).json({ message: 'Access denied: No group assigned' });
        return;
      }

      const permission = await prisma.groupPermission.findFirst({
        where: {
          moduleId: module.id,
          groupId: user.groupId,
          ...(action === 'read' ? { canRead: true } : { canWrite: true }),
        },
      });

      if (!permission) {
        res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error during permission check' });
    }
  };
};
