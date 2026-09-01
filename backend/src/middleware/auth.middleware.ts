import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { sendError } from '../utils/apiResponse';

export type { AuthRequest } from '../types/express';
import type { AuthRequest } from '../types/express';

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : queryToken;

    if (!token) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const payload = verifyToken(token);

    const user = await User.findById(payload.userId).select('isActive role email');
    if (!user || !user.isActive) {
      sendError(res, 'Invalid or inactive user', 401);
      return;
    }

    req.user = { ...payload, id: payload.userId };
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      req.user = { ...payload, id: payload.userId };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
