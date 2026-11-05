import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();

// Public leaderboard endpoint so anyone can view high scores
router.get('/', getLeaderboard);

export default router;
