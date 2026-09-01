import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../utils/logger';

dotenv.config();

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: env.admin.email.toLowerCase(), role: 'admin' });
  if (existing) {
    logger.info('Admin already exists, skipping seed');
    process.exit(0);
  }

  const hashedPassword = await hashPassword(env.admin.password);
  await User.create({
    name: env.admin.name,
    email: env.admin.email.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  logger.info(`Admin user created: ${env.admin.email}`);
  process.exit(0);
}

seedAdmin().catch((error) => {
  logger.error('Admin seed failed', error);
  process.exit(1);
});
