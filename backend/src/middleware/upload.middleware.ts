import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const ALLOWED_PROFILE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PROFILE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_DOC_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOC_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

function sanitizeExt(originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  return ALLOWED_PROFILE_EXTS.includes(ext) || ALLOWED_DOC_EXTS.includes(ext) ? ext : '';
}

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.upload.profilesDir),
  filename: (_req, file, cb) => {
    const ext = sanitizeExt(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.upload.documentsDir),
  filename: (_req, file, cb) => {
    const ext = sanitizeExt(file.originalname) || '.pdf';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function profileFileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_PROFILE_MIMES.includes(file.mimetype) && ALLOWED_PROFILE_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid profile photo. Allowed: JPG, JPEG, PNG, WEBP'));
  }
}

function documentFileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_DOC_MIMES.includes(file.mimetype) && ALLOWED_DOC_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document. Allowed: PDF, JPG, JPEG, PNG'));
  }
}

export const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: env.upload.profileMaxSize },
  fileFilter: profileFileFilter,
}).single('photo');

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: env.upload.documentMaxSize },
  fileFilter: documentFileFilter,
}).single('document');

export function handleMulterError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: 'File too large' });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next();
}
