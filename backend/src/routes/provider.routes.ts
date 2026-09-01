import { Router } from 'express';
import { providerController } from '../controllers/provider.controller';
import { authenticate } from '../middleware/auth.middleware';
import { providerOnly } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { updateProfileSchema, uploadDocumentSchema } from '../validators/provider.validator';
import { uploadProfilePhoto, uploadDocument, handleMulterError } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate, providerOnly);

router.get('/profile', providerController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), providerController.updateProfile);
router.post('/profile/photo', uploadLimiter, (req, res, next) => {
  uploadProfilePhoto(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, providerController.uploadPhoto);
router.post('/documents', uploadLimiter, (req, res, next) => {
  uploadDocument(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, validateBody(uploadDocumentSchema), providerController.uploadDocument);
router.delete('/documents/:id', providerController.deleteDocument);
router.post('/application/submit', providerController.submitApplication);
router.get('/application', providerController.getApplication);
router.get('/application/history', providerController.getHistory);

export default router;
