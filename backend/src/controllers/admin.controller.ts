import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/apiResponse';

export const adminController = {
  async listProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listProviders(req.query as Parameters<typeof adminService.listProviders>[0]);
      sendSuccess(res, 'Providers retrieved', result);
    } catch (error) {
      next(error);
    }
  },

  async getProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getProvider(req.params.id);
      sendSuccess(res, 'Provider retrieved', data);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await adminService.updateStatus(
        req.params.id,
        req.user!.userId,
        req.body.status,
        req.body.remarks
      );
      sendSuccess(res, 'Status updated', profile);
    } catch (error) {
      next(error);
    }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await adminService.approve(req.params.id, req.user!.userId);
      sendSuccess(res, 'Provider approved', profile);
    } catch (error) {
      next(error);
    }
  },

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await adminService.reject(req.params.id, req.user!.userId, req.body.remarks);
      sendSuccess(res, 'Provider rejected', profile);
    } catch (error) {
      next(error);
    }
  },

  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStatistics();
      sendSuccess(res, 'Statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  },

  async listCategories(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await adminService.manageCategories();
      sendSuccess(res, 'Categories retrieved', categories);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await adminService.createCategory(req.body);
      sendSuccess(res, 'Category created', category, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await adminService.updateCategory(req.params.id, req.body);
      sendSuccess(res, 'Category updated', category);
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adminService.deleteCategory(req.params.id);
      sendSuccess(res, 'Category deleted');
    } catch (error) {
      next(error);
    }
  },
};
