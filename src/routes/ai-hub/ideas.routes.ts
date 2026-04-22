/**
 * Ideas Routes
 * مسارات وحدة التفكير الإبداعي
 */

import { Router } from 'express';
import { generateIdeas } from '../../controllers/ai-hub/ideas.controller';

const router = Router();

/**
 * POST /api/ai-hub/ideas/generate
 * توليد أفكار / أسئلة / عناوين
 */
router.post('/generate', generateIdeas);

export default router;
