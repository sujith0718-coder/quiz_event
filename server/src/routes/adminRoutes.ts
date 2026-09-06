import { Router } from 'express';
import { getSubmissions, getAnalytics } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/submissions', authenticateToken, requireAdmin, getSubmissions);
router.get('/analytics', authenticateToken, requireAdmin, getAnalytics);

export default router;
