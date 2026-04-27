import { Router, Request, Response } from 'express';
import { TaskController } from '../../controllers/management/TaskController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const taskController = new TaskController();

router.use(authenticate);

// CRUD
router.post('/', requirePermission('tasks.create'), (req: Request, res: Response) => { taskController.createTask(req, res); });
router.get('/', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getAllTasks(req, res); });
router.get('/statuses', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTaskStatuses(req, res); });
router.get('/overdue', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getOverdueTasks(req, res); });
router.get('/order/:orderId', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTasksByOrder(req, res); });
router.get('/assignee/:userId', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTasksByAssignee(req, res); });
router.get('/status/:statusId', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTasksByStatus(req, res); });
router.post('/bulk-assign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.bulkAssignTasks(req, res); });
router.post('/bulk-status', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.bulkChangeStatus(req, res); });
router.get('/:id', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTask(req, res); });
router.put('/:id', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.updateTask(req, res); });
router.delete('/:id', requirePermission('tasks.delete'), (req: Request, res: Response) => { taskController.deleteTask(req, res); });

// Status
router.patch('/:id/status', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.changeTaskStatus(req, res); });
router.get('/:id/history', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTaskHistory(req, res); });

// Assignment
router.post('/:id/assign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.assignTask(req, res); });
router.post('/:id/reassign', requirePermission('tasks.assign'), (req: Request, res: Response) => { taskController.reassignTask(req, res); });
router.get('/:id/assignments', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTaskAssignments(req, res); });

// Comments & Attachments
router.post('/:id/comments', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.addComment(req, res); });
router.get('/:id/comments', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getComments(req, res); });
router.post('/:id/attachments', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.addAttachment(req, res); });
router.get('/:id/attachments', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getAttachments(req, res); });

// Relations
router.post('/:id/relations', requirePermission('tasks.edit'), (req: Request, res: Response) => { taskController.addRelation(req, res); });
router.get('/:id/relations', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getRelations(req, res); });
router.get('/:id/dependency', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.validateTaskDependency(req, res); });

// Business Logic
router.get('/:id/progress', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.calculateTaskProgress(req, res); });
router.get('/:id/can-delete', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.canDeleteTask(req, res); });
router.get('/:id/details', requirePermission('tasks.view'), (req: Request, res: Response) => { taskController.getTaskWithDetails(req, res); });
router.get('/:id/kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { taskController.getTaskKPI(req, res); });

export default router;
