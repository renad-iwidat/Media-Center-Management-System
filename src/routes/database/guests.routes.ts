/**
 * Guests Routes
 * مسارات الضيوف
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { GuestsController } from '../../controllers/database/programs.controller';

const router = Router();

// تطبيق middleware المصادقة على جميع routes الضيوف
router.use(authenticate);

/** GET /api/guests?search=... - جميع الضيوف أو بحث */
router.get('/', GuestsController.getAllGuests);

/** GET /api/guests/:id - ضيف بالـ ID */
router.get('/:id', GuestsController.getGuestById);

export default router;
