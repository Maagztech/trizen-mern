import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { ProviderProfile, IVerificationDocument } from '../models/ProviderProfile';
import { AuthRequest } from '../types/express';

export const uploadService = {
  getProfilePhotoPath(filename: string): string {
    const safeName = path.basename(filename);
    const filePath = path.join(env.upload.profilesDir, safeName);
    if (!filePath.startsWith(env.upload.profilesDir)) {
      throw new AppError('Invalid file path', 400);
    }
    return filePath;
  },

  getDocumentById(profileId: string, documentId: string): IVerificationDocument | null {
    return null; // resolved in controller via profile lookup
  },

  async resolveDocumentFile(
    profileId: string,
    documentId: string,
    userId: string,
    role: string
  ): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const profile = await ProviderProfile.findById(profileId);
    if (!profile) throw new AppError('Profile not found', 404);

    if (role === 'provider' && profile.userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    const doc = profile.verificationDocuments.find((d) => d._id?.toString() === documentId);
    if (!doc) throw new AppError('Document not found', 404);

    const filePath = path.resolve(doc.filePath);
    if (!filePath.startsWith(env.upload.path)) {
      throw new AppError('Invalid document path', 400);
    }
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on server', 404);
    }

    return { filePath, fileName: doc.fileName, mimeType: doc.mimeType };
  },

  async resolveProfilePhoto(
    filename: string,
    req: AuthRequest
  ): Promise<string> {
    const safeName = path.basename(filename);
    const filePath = this.getProfilePhotoPath(safeName);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }

    if (req.user?.role === 'provider') {
      const profile = await ProviderProfile.findOne({ userId: req.user.userId });
      if (!profile?.profilePhoto?.includes(safeName)) {
        throw new AppError('Access denied', 403);
      }
    }

    return filePath;
  },

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore deletion errors
    }
  },
};
