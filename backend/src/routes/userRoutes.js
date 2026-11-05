import { Router } from 'express';
import { getProfile, updateAvatar } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/profile', getProfile);
router.put('/avatar', updateAvatar);

export default router;
