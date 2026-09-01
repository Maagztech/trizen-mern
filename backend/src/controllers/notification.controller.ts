import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { getDbStatus } from '../config/db';

export const notificationController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getForUser(req.user!.userId);
      const unreadCount = await notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, 'Notifications retrieved', { notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user!.userId);
      sendSuccess(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },
};

export const healthController = {
  async check(_req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'API is healthy',
      data: { database: getDbStatus(), timestamp: new Date().toISOString() },
    });
  },
};
