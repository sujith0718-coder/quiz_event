import { Router } from 'express';
import { submitAnswer, getTeamSubmissions } from '../controllers/submissionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateToken, submitAnswer);
router.get('/my-team', authenticateToken, getTeamSubmissions);

export default router;
