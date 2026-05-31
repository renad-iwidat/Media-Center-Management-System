import { Router, Request, Response } from 'express';
import { ChatbotController } from '../../controllers/management/ChatbotController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const chatbotController = new ChatbotController();

// المساعد الذكي — متاح لأي مستخدم مسجّل دخول
router.use(authenticate);

router.post('/', (req: Request, res: Response) => {
  chatbotController.chat(req, res);
});

export default router;
