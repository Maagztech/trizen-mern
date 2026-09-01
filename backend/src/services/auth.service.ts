import { User } from '../models/User';
import { ProviderProfile } from '../models/ProviderProfile';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { emailService } from './email.service';
import { notificationService } from './notification.service';

export const authService = {
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: 'provider',
    });

    await ProviderProfile.create({
      userId: user._id,
      fullName: data.name,
      phone: data.phone,
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await emailService.sendRegistrationEmail(user.name, user.email);
    await notificationService.create(
      user._id,
      'Welcome!',
      'Your account has been created. Complete your profile to get started.',
      'success'
    );

    const userObj = user.toJSON();
    return { user: userObj, token };
  },

  async login(email: string, password: string, role?: 'provider' | 'admin') {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (role && user.role !== role) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user.toJSON();
  },

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await User.findOne({
      $or: [{ googleId: profile.googleId }, { email: profile.email.toLowerCase() }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        if (profile.avatar) user.avatar = profile.avatar;
        await user.save();
      }
    } else {
      user = await User.create({
        name: profile.name,
        email: profile.email.toLowerCase(),
        googleId: profile.googleId,
        avatar: profile.avatar,
        role: 'provider',
      });

      await ProviderProfile.create({
        userId: user._id,
        fullName: profile.name,
      });

      await emailService.sendRegistrationEmail(user.name, user.email);
      await notificationService.create(
        user._id,
        'Welcome!',
        'Your Google account has been linked. Complete your profile to get started.',
        'success'
      );
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },
};
