import { Router } from 'express';
import { createTeam, joinTeam, getMyTeam, getAllTeams } from '../controllers/teamController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.post('/create', authenticateToken, createTeam);
router.post('/join', authenticateToken, joinTeam);
router.get('/me', authenticateToken, getMyTeam);
router.get('/all', authenticateToken, requireAdmin, getAllTeams);

export default router;
