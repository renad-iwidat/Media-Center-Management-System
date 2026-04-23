import { Router, Request, Response } from 'express';
import { TaskController } from '../../controllers/management/TaskController';

/**
 * Task Routes
 * 
 * All routes for task management:
 * - CRUD operations
 * - Status management
 * - Assignment management
 * - Comments and attachments
 * - Relations and dependencies
 * - Filtering and search
 * - Business logic endpoints
 */

const router = Router();
const taskController = new TaskController();

// ============ CRUD Operations ============

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', (req: Request, res: Response) => {
  taskController.createTask(req, res);
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  taskController.getTask(req, res);
});

/**
 * GET /api/tasks
 * Get all tasks with pagination
 */
router.get('/', (req: Request, res: Response) => {
  taskController.getAllTasks(req, res);
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', (req: Request, res: Response) => {
  taskController.updateTask(req, res);
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', (req: Request, res: Response) => {
  taskController.deleteTask(req, res);
});

// ============ Status Management ============

/**
 * PATCH /api/tasks/:id/status
 * Change task status
 */
router.patch('/:id/status', (req: Request, res: Response) => {
  taskController.changeTaskStatus(req, res);
});

/**
 * GET /api/tasks/statuses
 * Get all available task statuses
 */
router.get('/statuses', (req: Request, res: Response) => {
  taskController.getTaskStatuses(req, res);
});

/**
 * GET /api/tasks/:id/history
 * Get task status change history
 */
router.get('/:id/history', (req: Request, res: Response) => {
  taskController.getTaskHistory(req, res);
});

// ============ Assignment Management ============

/**
 * POST /api/tasks/:id/assign
 * Assign task to a user
 */
router.post('/:id/assign', (req: Request, res: Response) => {
  taskController.assignTask(req, res);
});

/**
 * POST /api/tasks/:id/reassign
 * Reassign task to a different user
 */
router.post('/:id/reassign', (req: Request, res: Response) => {
  taskController.reassignTask(req, res);
});

/**
 * GET /api/tasks/:id/assignments
 * Get task assignment history
 */
router.get('/:id/assignments', (req: Request, res: Response) => {
  taskController.getTaskAssignments(req, res);
});

// ============ Comments & Attachments ============

/**
 * POST /api/tasks/:id/comments
 * Add comment to task
 */
router.post('/:id/comments', (req: Request, res: Response) => {
  taskController.addComment(req, res);
});

/**
 * GET /api/tasks/:id/comments
 * Get task comments
 */
router.get('/:id/comments', (req: Request, res: Response) => {
  taskController.getComments(req, res);
});

/**
 * POST /api/tasks/:id/attachments
 * Add attachment to task
 */
router.post('/:id/attachments', (req: Request, res: Response) => {
  taskController.addAttachment(req, res);
});

/**
 * GET /api/tasks/:id/attachments
 * Get task attachments
 */
router.get('/:id/attachments', (req: Request, res: Response) => {
  taskController.getAttachments(req, res);
});

// ============ Relations & Dependencies ============

/**
 * POST /api/tasks/:id/relations
 * Add relation/dependency to task
 */
router.post('/:id/relations', (req: Request, res: Response) => {
  taskController.addRelation(req, res);
});

/**
 * GET /api/tasks/:id/relations
 * Get task relations
 */
router.get('/:id/relations', (req: Request, res: Response) => {
  taskController.getRelations(req, res);
});

/**
 * GET /api/tasks/:id/dependency
 * Validate task dependency
 */
router.get('/:id/dependency', (req: Request, res: Response) => {
  taskController.validateTaskDependency(req, res);
});

// ============ Filtering & Search ============

/**
 * GET /api/tasks/order/:orderId
 * Get tasks by order
 */
router.get('/order/:orderId', (req: Request, res: Response) => {
  taskController.getTasksByOrder(req, res);
});

/**
 * GET /api/tasks/assignee/:userId
 * Get tasks by assignee
 */
router.get('/assignee/:userId', (req: Request, res: Response) => {
  taskController.getTasksByAssignee(req, res);
});

/**
 * GET /api/tasks/status/:statusId
 * Get tasks by status
 */
router.get('/status/:statusId', (req: Request, res: Response) => {
  taskController.getTasksByStatus(req, res);
});

/**
 * GET /api/tasks/overdue
 * Get overdue tasks
 */
router.get('/overdue', (req: Request, res: Response) => {
  taskController.getOverdueTasks(req, res);
});

// ============ Business Logic ============

/**
 * GET /api/tasks/:id/progress
 * Calculate task progress
 */
router.get('/:id/progress', (req: Request, res: Response) => {
  taskController.calculateTaskProgress(req, res);
});

/**
 * GET /api/tasks/:id/can-delete
 * Check if task can be deleted
 */
router.get('/:id/can-delete', (req: Request, res: Response) => {
  taskController.canDeleteTask(req, res);
});

/**
 * POST /api/tasks/bulk-assign
 * Bulk assign tasks to a user
 */
router.post('/bulk-assign', (req: Request, res: Response) => {
  taskController.bulkAssignTasks(req, res);
});

/**
 * POST /api/tasks/bulk-status
 * Bulk change status for multiple tasks
 */
router.post('/bulk-status', (req: Request, res: Response) => {
  taskController.bulkChangeStatus(req, res);
});

/**
 * GET /api/tasks/:id/details
 * Get task with all details (comments, attachments, relations, history)
 */
router.get('/:id/details', (req: Request, res: Response) => {
  taskController.getTaskWithDetails(req, res);
});

// ============ KPI ============

/**
 * GET /api/tasks/:id/kpi
 * Get task KPI metrics
 */
router.get('/:id/kpi', (req: Request, res: Response) => {
  taskController.getTaskKPI(req, res);
});

export default router;
