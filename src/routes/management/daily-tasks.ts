import { Router, Request, Response } from 'express';
import { DailyTaskController } from '../../controllers/management/DailyTaskController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const dailyTaskController = new DailyTaskController();

// كل المسارات تتطلب تسجيل دخول
router.use(authenticate);

// ============ إدارة القوالب ============
// التخويل داخل الخدمة: الموظف يدير قوالبه الخاصة، والمدير (daily_tasks.manage) يدير أي موظف.
router.post('/templates', (req: Request, res: Response) => { dailyTaskController.createTemplate(req, res); });
router.patch('/templates/reorder', (req: Request, res: Response) => { dailyTaskController.reorderTemplates(req, res); });
router.put('/templates/:id', (req: Request, res: Response) => { dailyTaskController.updateTemplate(req, res); });
router.delete('/templates/:id', (req: Request, res: Response) => { dailyTaskController.deleteTemplate(req, res); });

// عرض القوالب: الموظف يرى قوالبه، والمدير يرى أي موظف (التحقق داخل الخدمة)
router.get('/templates', (req: Request, res: Response) => { dailyTaskController.getTemplates(req, res); });

// ============ قائمة التحقق والإنجاز (موظف/مدير) ============
router.get('/checklist', (req: Request, res: Response) => { dailyTaskController.getChecklist(req, res); });
router.post('/checklist/items/:templateId/complete', (req: Request, res: Response) => { dailyTaskController.completeItem(req, res); });
router.post('/checklist/items/:templateId/uncomplete', (req: Request, res: Response) => { dailyTaskController.uncompleteItem(req, res); });

export default router;
