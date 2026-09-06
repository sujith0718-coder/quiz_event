import { Router } from 'express';
import { getEvents, getActiveEvent, createEvent, updateEventStatus, toggleFreeze } from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', getEvents);
router.get('/active', getActiveEvent);
router.post('/', authenticateToken, requireAdmin, createEvent);
router.put('/:id/status', authenticateToken, requireAdmin, updateEventStatus);
router.put('/:id/freeze', authenticateToken, requireAdmin, toggleFreeze);

export default router;
