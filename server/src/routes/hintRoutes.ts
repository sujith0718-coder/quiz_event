import { Router } from 'express';
import { requestHint } from '../controllers/hintController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireParticipant } from '../middleware/rbac.js';

const router = Router();

// POST /api/questions/:id/hint
// Participants only — team membership verified inside controller
router.post('/:id/hint', authenticateToken, requireParticipant, requestHint);

export default router;
