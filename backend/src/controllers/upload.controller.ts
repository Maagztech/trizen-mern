import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthRequest } from '../types/express';
import { uploadService } from '../services/upload.service';
import { ProviderProfile } from '../models/ProviderProfile';
import { AppError } from '../middleware/error.middleware';

export const uploadController = {
  async getProfilePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filePath = await uploadService.resolveProfilePhoto(req.params.filename, req);
      const resolved = path.resolve(filePath);
      const ext = path.extname(resolved).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      if (mimeMap[ext]) {
        res.setHeader('Content-Type', mimeMap[ext]);
      }
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(resolved);
    } catch (error) {
      next(error);
    }
  },

  async getDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await ProviderProfile.findOne({ userId: req.user!.userId });
      let profileId = req.query.profileId as string;

      if (req.user!.role === 'provider') {
        if (!profile) throw new AppError('Profile not found', 404);
        profileId = profile._id.toString();
      }

      if (!profileId) throw new AppError('Profile ID required', 400);

      const doc = await uploadService.resolveDocumentFile(
        profileId,
        req.params.id,
        req.user!.userId,
        req.user!.role
      );

      if (req.query.download === 'true') {
        res.download(doc.filePath, doc.fileName);
      } else {
        res.setHeader('Content-Type', doc.mimeType);
        res.sendFile(path.resolve(doc.filePath));
      }
    } catch (error) {
      next(error);
    }
  },
};
