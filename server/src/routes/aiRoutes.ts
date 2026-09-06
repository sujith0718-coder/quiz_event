import { Router } from 'express';
import { getAIHint } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/hint', authenticateToken, getAIHint);

export default router;
