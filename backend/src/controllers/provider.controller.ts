import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthRequest } from '../types/express';
import { providerService } from '../services/provider.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

export const providerController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await providerService.getProfile(req.user!.userId);
      sendSuccess(res, 'Profile retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await providerService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, 'Profile updated', data);
    } catch (error) {
      next(error);
    }
  },

  async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const profile = await providerService.uploadProfilePhoto(
        req.user!.userId,
        req.file.filename,
        req.file.path
      );
      sendSuccess(res, 'Profile photo uploaded', { profilePhoto: profile.profilePhoto });
    } catch (error) {
      next(error);
    }
  },

  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const profile = await providerService.uploadDocument(req.user!.userId, {
        documentType: req.body.documentType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
      sendSuccess(res, 'Document uploaded', profile);
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await providerService.deleteDocument(req.user!.userId, req.params.id);
      sendSuccess(res, 'Document deleted', profile);
    } catch (error) {
      next(error);
    }
  },

  async submitApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await providerService.submitApplication(req.user!.userId);
      sendSuccess(res, 'Application submitted successfully', profile);
    } catch (error) {
      next(error);
    }
  },

  async getApplication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await providerService.getApplication(req.user!.userId);
      sendSuccess(res, 'Application retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await providerService.getApplicationHistory(req.user!.userId);
      sendSuccess(res, 'Application history retrieved', history);
    } catch (error) {
      next(error);
    }
  },
};
