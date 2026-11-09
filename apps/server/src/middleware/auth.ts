import { Request, Response, NextFunction } from 'express';
import { AuthTokenPayload, Role } from '@dumline/shared';
import { verifyJwt } from '../utils/crypto';
import { AppError } from '../utils/errors';

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // Optional cookie support
  if (typeof req.headers.cookie === 'string') {
    const match = req.headers.cookie.match(/(?:^|;\s*)dumline_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return next(AppError.unauthorized('Invalid or expired authentication token', 'AUTH_INVALID_TOKEN'));
  }

  req.user = payload;
  next();
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyJwt(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          'ROLE_FORBIDDEN'
        )
      );
    }

    next();
  };
}

export function requireOutletAccess(getOutletId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Central admin has unrestricted cross-outlet access
    }

    const targetOutletId = getOutletId(req);
    if (!targetOutletId) {
      return next(AppError.badRequest('Target outlet ID is required', 'OUTLET_ID_REQUIRED'));
    }

    if (req.user.role === 'KITCHEN_STAFF' || req.user.role === 'OUTLET_MANAGER') {
      if (req.user.assignedOutletId !== targetOutletId) {
        return next(
          AppError.forbidden(
            'Staff is isolated to their assigned outlet only',
            'CROSS_OUTLET_FORBIDDEN'
          )
        );
      }
    }

    next();
  };
}
