import { Router, Request, Response } from 'express';
import { TaskController } from '../../controllers/management/TaskController';
import { authenticate, requirePermission } from '../../middleware/auth';
import multer from 'multer';

const router = Router();
const taskController = new TaskController();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// كل هاي الـ routes بتطلب تسجيل دخول فقط
router.use(authenticate);

// ============ CRUD - عرض (مفتوحة لكل المستخدمين المسجلين) ============
router.get('/statuses', (req: Request, res: Response) => { taskController.getTaskStatuses(req, res); });
router.get('/types', (req: Request, res: Response) => { taskController.getTaskTypes(req, res); });
router.get('/overdue', (req: Request, res: Response) => { taskController.getOverdueTasks(req, res); });
router.get('/', (req: Request, res: Response) => { taskController.getAllTasks(req, res); });

// ============ Bulk Operations (تحتاج صلاحيات) ============
router.post('/bulk-assign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.bulkAssignTasks(req, res); });
router.post('/bulk-status', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.bulkChangeStatus(req, res); });

// ============ إنشاء مهمة (يحتاج صلاحية) ============
router.post('/', requirePermission('tasks.create'), (req: Request, res: Response) => { taskController.createTask(req, res); });

// ============ ID-based routes - عرض (مفتوحة) ============
router.get('/:id/statuses', (req: Request, res: Response) => { taskController.getTaskStatuses(req, res); });
router.get('/:id/history', (req: Request, res: Response) => { taskController.getTaskHistory(req, res); });
router.get('/:id/assignments', (req: Request, res: Response) => { taskController.getTaskAssignments(req, res); });
router.get('/:id/comments', (req: Request, res: Response) => { taskController.getComments(req, res); });
router.get('/:id/attachments', (req: Request, res: Response) => { taskController.getAttachments(req, res); });
router.get('/:id/relations', (req: Request, res: Response) => { taskController.getRelations(req, res); });
router.get('/:id/dependency', (req: Request, res: Response) => { taskController.validateTaskDependency(req, res); });
router.get('/:id/progress', (req: Request, res: Response) => { taskController.calculateTaskProgress(req, res); });
router.get('/:id/can-delete', (req: Request, res: Response) => { taskController.canDeleteTask(req, res); });
router.get('/:id/details', (req: Request, res: Response) => { taskController.getTaskWithDetails(req, res); });
router.get('/:id/kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { taskController.getTaskKPI(req, res); });

// ============ Status & Assignment ============
// تغيير الحالة - مفتوح للكل
router.patch('/:id/status', (req: Request, res: Response) => { taskController.changeTaskStatus(req, res); });
// التعيين يحتاج صلاحية
router.post('/:id/assign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.assignTask(req, res); });
router.post('/:id/reassign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.reassignTask(req, res); });

// ============ Comments (مفتوحة لكل المستخدمين المسجلين) ============
// أي مستخدم يقدر يضيف تعليق
router.post('/:id/comments', (req: Request, res: Response) => { taskController.addComment(req, res); });
// التعديل والحذف بيتحقق من الـ ownership داخل الـ service
router.put('/:id/comments/:commentId', (req: Request, res: Response) => { taskController.updateComment(req, res); });
router.delete('/:id/comments/:commentId', (req: Request, res: Response) => { taskController.deleteComment(req, res); });

// ============ Mentions (مفتوحة) ============
router.get('/:id/mentions', (req: Request, res: Response) => { taskController.getMentions(req, res); });
router.post('/:id/mentions', (req: Request, res: Response) => { taskController.addMention(req, res); });

// ============ Attachments (مفتوحة لكل المستخدمين المسجلين) ============
// أي مستخدم يقدر يرفع ملف
router.post('/:id/attachments', (req: Request, res: Response) => { taskController.addAttachment(req, res); });
router.post('/:id/upload', upload.single('file'), (req: Request, res: Response) => { taskController.uploadAttachment(req, res); });
// التعديل والحذف بيتحقق من الـ ownership داخل الـ service
router.put('/:id/attachments/:attachmentId', (req: Request, res: Response) => { taskController.updateAttachment(req, res); });
router.delete('/:id/attachments/:attachmentId', (req: Request, res: Response) => { taskController.deleteAttachment(req, res); });

// ============ Relations (تحتاج صلاحيات) ============
router.post('/:id/relations', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.addRelation(req, res); });

// ============ Generic ID routes ============
router.get('/:id', (req: Request, res: Response) => { taskController.getTask(req, res); });
router.put('/:id', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.updateTask(req, res); });
router.patch('/:id', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.updateTask(req, res); });
router.delete('/:id', requirePermission('tasks.delete'), (req: Request, res: Response) => { taskController.deleteTask(req, res); });

// ============ Parameterized routes - مفتوحة ============
router.get('/order/:orderId', (req: Request, res: Response) => { taskController.getTasksByOrder(req, res); });
router.get('/assignee/:userId', (req: Request, res: Response) => { taskController.getTasksByAssignee(req, res); });
router.get('/status/:statusId', (req: Request, res: Response) => { taskController.getTasksByStatus(req, res); });

export default router;
