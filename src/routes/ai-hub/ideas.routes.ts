/**
 * Ideas Routes
 * مسارات وحدة التفكير الإبداعي
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { generateIdeas } from '../../controllers/ai-hub/ideas.controller';
import { createAILogger } from '../../middleware/ai-usage-logger.middleware';

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

/**
 * POST /api/ai-hub/ideas/generate
 * توليد أفكار / أسئلة / عناوين
 */
router.post('/generate', createAILogger('ideas', 'generate'), generateIdeas);

export default router;
