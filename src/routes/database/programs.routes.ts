/**
 * Programs & Guests Routes
 * مسارات البرامج والحلقات والضيوف
 * ملاحظة: الـ routes الثابتة لازم تجي قبل الـ dynamic /:id
 */

import { Router } from 'express';
import { ProgramsController, GuestsController } from '../../controllers/database/programs.controller';

const router = Router();

// ─── Episodes (ثابتة — لازم قبل /:id) ───────────────────────
/** GET /api/programs/episodes/:id/details - حلقة بالـ ID مع ضيوفها */
router.get('/episodes/:id/details', ProgramsController.getEpisodeWithGuests);

/** GET /api/programs/episodes/:id/guests - ضيوف حلقة معينة */
router.get('/episodes/:id/guests', GuestsController.getGuestsByEpisode);

// ─── Programs (dynamic — بعد الثابتة) ───────────────────────
/** GET /api/programs - جميع البرامج */
router.get('/', ProgramsController.getAllPrograms);

/** GET /api/programs/:id/episodes - حلقات برنامج معين */
router.get('/:id/episodes', ProgramsController.getEpisodesByProgram);

/** GET /api/programs/:id - برنامج بالـ ID */
router.get('/:id', ProgramsController.getProgramById);

export default router;
