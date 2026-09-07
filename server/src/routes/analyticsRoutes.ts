import { Router } from 'express';
import {
  getOverview,
  getQuestionStats,
  getTeamStats,
  getSubmissionHeatmap,
  getFullDashboard,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

// All analytics routes are admin-only
router.use(authenticateToken, requireAdmin);

router.get('/overview', getOverview);
router.get('/questions', getQuestionStats);
router.get('/teams', getTeamStats);
router.get('/heatmap', getSubmissionHeatmap);
router.get('/dashboard', getFullDashboard);

export default router;
