import { Router } from 'express';
import {
  getQuestionsForAdmin,
  getQuestionsForParticipant,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/participant', authenticateToken, getQuestionsForParticipant);
router.get('/admin', authenticateToken, requireAdmin, getQuestionsForAdmin);
router.post('/', authenticateToken, requireAdmin, createQuestion);
router.put('/:id', authenticateToken, requireAdmin, updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, deleteQuestion);

export default router;
