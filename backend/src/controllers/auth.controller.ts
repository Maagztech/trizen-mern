import { Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthRequest } from '../types/express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { googleService } from '../services/google.service';
import { AppError } from '../middleware/error.middleware';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, 'Registration successful', result, 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      sendSuccess(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  },

  async adminLogin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password, 'admin');
      sendSuccess(res, 'Admin login successful', result);
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, 'User retrieved', user);
    } catch (error) {
      next(error);
    }
  },

  googleAuth(req: AuthRequest, res: Response, next: NextFunction) {
    if (!googleService.isConfigured()) {
      sendError(res, 'Google OAuth is not configured', 503);
      return;
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
  },

  googleCallback(req: AuthRequest, res: Response, next: NextFunction) {
    if (!googleService.isConfigured()) {
      sendError(res, 'Google OAuth is not configured', 503);
      return;
    }

    passport.authenticate('google', { session: false }, (err: Error | null, result: { token: string; user: { role: string } } | false) => {
      if (err || !result) {
        const message = err?.message || 'Google authentication failed';
        res.redirect(`${env.clientUrl}/login?error=${encodeURIComponent(message)}`);
        return;
      }

      const redirectPath = result.user.role === 'admin' ? '/admin/dashboard' : '/provider/dashboard';
      res.redirect(`${env.clientUrl}/auth/google/callback?token=${result.token}&redirect=${redirectPath}`);
    })(req, res, next);
  },
};
