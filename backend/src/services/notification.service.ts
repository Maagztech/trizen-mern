import { Types } from 'mongoose';
import { Notification } from '../models/Notification';

export const notificationService = {
  async create(
    userId: string | Types.ObjectId,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) {
    return Notification.create({ userId, title, message, type });
  },

  async getForUser(userId: string, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  },

  async getUnreadCount(userId: string) {
    return Notification.countDocuments({ userId, isRead: false });
  },

  async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  },

  async markAllAsRead(userId: string) {
    return Notification.updateMany({ userId, isRead: false }, { isRead: true });
  },
};
