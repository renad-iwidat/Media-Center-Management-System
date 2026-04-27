import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/management/AuthService';
import { PermissionService } from '../services/management/PermissionService';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      userPermissions?: string[];
    }
  }
}

/**
 * وسيط المصادقة — بيتحقق من التوكن
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No token provided',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * وسيط الصلاحيات — بيشيك من الداتابيس
 * بيقبل صلاحية واحدة أو أكثر — لازم المستخدم يكون عنده وحدة منهم على الأقل
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Access denied. Not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const userPermissions = await PermissionService.getUserPermissions(BigInt(req.user.user_id));
      req.userPermissions = userPermissions;

      const hasPermission = permissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({
        success: false,
        error: 'Failed to check permissions',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * وسيط قديم للتوافق — بيشيك على اسم الدور
 * @deprecated استخدم requirePermission بدله
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Access denied. Not authenticated', timestamp: new Date().toISOString() });
      return;
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions', timestamp: new Date().toISOString() });
      return;
    }
    next();
  };
}
