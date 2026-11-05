import { Router } from 'express';
import { startRound, getHint, submitAnswer } from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All game endpoints strictly require authentication ("to play game need to login")
router.use(authenticateToken);

router.post('/start', startRound);
router.post('/hint', getHint);
router.post('/submit', submitAnswer);

export default router;
