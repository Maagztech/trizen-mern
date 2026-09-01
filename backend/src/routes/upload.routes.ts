import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile/:filename', uploadController.getProfilePhoto);
router.get('/document/:id', uploadController.getDocument);

export default router;
