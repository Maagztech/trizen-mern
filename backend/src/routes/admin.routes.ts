import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { providerListQuerySchema, statusUpdateSchema, rejectSchema, categorySchema } from '../validators/provider.validator';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/providers', validateQuery(providerListQuerySchema), adminController.listProviders);
router.get('/providers/:id', adminController.getProvider);
router.patch('/providers/:id/status', validateBody(statusUpdateSchema), adminController.updateStatus);
router.patch('/providers/:id/approve', adminController.approve);
router.patch('/providers/:id/reject', validateBody(rejectSchema), adminController.reject);
router.get('/statistics', adminController.getStatistics);

export default router;

const categoryRouter = Router();

categoryRouter.get('/', adminController.listCategories);
categoryRouter.post('/', authenticate, adminOnly, validateBody(categorySchema), adminController.createCategory);
categoryRouter.put('/:id', authenticate, adminOnly, validateBody(categorySchema.partial()), adminController.updateCategory);
categoryRouter.delete('/:id', authenticate, adminOnly, adminController.deleteCategory);

export { categoryRouter };
