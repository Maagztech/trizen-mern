import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = path.resolve(process.cwd(), uploadDir);

const profilesDir = path.join(uploadPath, 'profiles');
const documentsDir = path.join(uploadPath, 'documents');

[uploadPath, profilesDir, documentsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/service-provider-portal'),
  jwtSecret: requireEnv('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: requireEnv('CLIENT_URL', 'http://localhost:5173'),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@example.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Service Provider Portal',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
  upload: {
    dir: uploadDir,
    path: uploadPath,
    profilesDir,
    documentsDir,
    profileMaxSize: 5 * 1024 * 1024,
    documentMaxSize: 10 * 1024 * 1024,
  },
  isProduction: process.env.NODE_ENV === 'production',
};
