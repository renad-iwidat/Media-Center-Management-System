import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AdminProcedureController } from '../../controllers/administrative/AdminProcedureController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new AdminProcedureController();

// Multer configuration للرفع
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB - يقبل كل أنواع الملفات (صور، فيديوهات، وثائق، إلخ)
  },
});

// كل الـ routes تحتاج تسجيل دخول
router.use(authenticate);

// ============ Access Control ============
router.get('/access/check', (req: Request, res: Response) => { 
  controller.checkAccess(req, res); 
});
router.get('/access/users', (req: Request, res: Response) => { 
  controller.getAuthorizedUsers(req, res); 
});
router.post('/access/grant', (req: Request, res: Response) => { 
  controller.grantAccess(req, res); 
});
router.delete('/access/:userId', (req: Request, res: Response) => { 
  controller.revokeAccess(req, res); 
});

// ============ Categories (الأقسام الأربعة) ============
router.get('/categories', (req: Request, res: Response) => { 
  controller.getAllCategories(req, res); 
});
router.get('/categories/:id', (req: Request, res: Response) => { 
  controller.getCategoryById(req, res); 
});
router.get('/categories/:categoryId/orders', (req: Request, res: Response) => { 
  controller.getOrdersByCategory(req, res); 
});

// ============ My Tasks (مهامي) ============
router.get('/my-tasks', (req: Request, res: Response) => { 
  controller.getMyTasks(req, res); 
});

// ============ Archive (الأرشيف) ============
router.get('/archive', (req: Request, res: Response) => { 
  controller.getArchive(req, res); 
});
router.post('/archive/:id/restore', (req: Request, res: Response) => { 
  controller.restoreFromArchive(req, res); 
});

// ============ Orders (الطلبات الإدارية) ============
router.post('/orders', (req: Request, res: Response) => { 
  controller.createOrder(req, res); 
});
router.get('/orders', (req: Request, res: Response) => { 
  controller.getOrders(req, res); 
});
router.get('/orders/:id', (req: Request, res: Response) => { 
  controller.getOrderById(req, res); 
});
router.put('/orders/:id', (req: Request, res: Response) => { 
  controller.updateOrder(req, res); 
});
router.delete('/orders/:id', (req: Request, res: Response) => { 
  controller.deleteOrder(req, res); 
});
router.post('/orders/:id/archive', (req: Request, res: Response) => { 
  controller.archiveOrder(req, res); 
});
router.get('/orders/:orderId/tasks', (req: Request, res: Response) => { 
  controller.getTasksForOrder(req, res); 
});

// ============ Tasks (المهام الإدارية) ============
router.post('/tasks', (req: Request, res: Response) => { 
  controller.createTask(req, res); 
});
router.get('/tasks/:id', (req: Request, res: Response) => { 
  controller.getTaskById(req, res); 
});
router.put('/tasks/:id', (req: Request, res: Response) => { 
  controller.updateTask(req, res); 
});
router.delete('/tasks/:id', (req: Request, res: Response) => { 
  controller.deleteTask(req, res); 
});
router.patch('/tasks/:id/status', (req: Request, res: Response) => { 
  controller.changeTaskStatus(req, res); 
});
router.post('/tasks/:id/assign', (req: Request, res: Response) => { 
  controller.assignUsersToTask(req, res); 
});
router.delete('/tasks/:id/assign/:userId', (req: Request, res: Response) => { 
  controller.unassignUser(req, res); 
});
router.post('/tasks/:id/archive', (req: Request, res: Response) => { 
  controller.archiveTask(req, res); 
});

// ============ Comments (التعليقات والمنشنات) ============
router.post('/tasks/:id/comments', (req: Request, res: Response) => { 
  controller.addComment(req, res); 
});
router.get('/tasks/:id/comments', (req: Request, res: Response) => { 
  controller.getTaskComments(req, res); 
});
router.delete('/comments/:id', (req: Request, res: Response) => { 
  controller.deleteComment(req, res); 
});
router.put('/comments/:id', (req: Request, res: Response) => { 
  controller.updateComment(req, res); 
});

// ============ Attachments (الملفات المرفقة) ============
router.post('/tasks/:id/attachments', (req: Request, res: Response) => { 
  controller.addAttachment(req, res); 
});
router.post('/tasks/:id/upload', upload.single('file'), (req: Request, res: Response) => { 
  controller.uploadAttachment(req, res); 
});
router.get('/tasks/:id/attachments', (req: Request, res: Response) => { 
  controller.getTaskAttachments(req, res); 
});
router.delete('/attachments/:id', (req: Request, res: Response) => { 
  controller.deleteAttachment(req, res); 
});
router.get('/attachments/:id/download', (req: Request, res: Response) => { 
  controller.getAttachmentDownloadUrl(req, res); 
});

// ============ Task History (سجل التغييرات) ============
router.get('/tasks/:id/history', (req: Request, res: Response) => { 
  controller.getTaskHistory(req, res); 
});

// ============ خدمات الموظفين (متاحة للجميع) ============
// تقديم طلب إجازة/مغادرة (لا يحتاج صلاحية إدارية)
router.post('/leave-request', (req: Request, res: Response) => { 
  controller.submitLeaveRequest(req, res); 
});
// جلب طلبات الإجازة الخاصة بي
router.get('/my-leave-requests', (req: Request, res: Response) => { 
  controller.getMyLeaveRequests(req, res); 
});

export default router;
