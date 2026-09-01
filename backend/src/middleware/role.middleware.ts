import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { sendError } from '../utils/apiResponse';
import { UserRole } from '../types';

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to access this resource', 403);
      return;
    }

    next();
  };
}

export const providerOnly = authorize('provider');
export const adminOnly = authorize('admin');
