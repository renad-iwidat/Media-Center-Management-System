import { Request, Response } from 'express';
import { TaskService } from '../../services/management/TaskService';
import { TaskAutomationService } from '../../services/management/TaskAutomationService';
import { KPIService } from '../../services/management/KPIService';

/**
 * TaskController - Handles all Task-related API endpoints
 * 
 * Responsibilities:
 * - Handle HTTP requests/responses
 * - Validate request data
 * - Call TaskService methods
 * - Format and send responses
 */
export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  // ============ CRUD Operations ============

  /**
   * POST /api/tasks
   * Create a new task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, order_id, assigned_to, status_id, priority_id, deadline, task_type_id } = req.body;

      // Validate required fields
      if (!title || !order_id || !assigned_to || !status_id || !priority_id) {
        this.sendError(res, 'Missing required fields', 400);
        return;
      }

      const task = await this.taskService.createTask({
        title,
        description,
        order_id: BigInt(order_id),
        assigned_to: BigInt(assigned_to),
        status_id: BigInt(status_id),
        priority_id: BigInt(priority_id),
        deadline: deadline ? new Date(deadline) : undefined,
        task_type_id: task_type_id ? BigInt(task_type_id) : undefined,
      });

      this.sendSuccess(res, task, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id
   * Get a single task by ID
   */
  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const task = await this.taskService.getTask(BigInt(id));
      this.sendSuccess(res, task, 200);
    } catch (error) {
      this.sendError(res, error, 404);
    }
  }

  /**
   * GET /api/tasks
   * Get all tasks with pagination
   */
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const tasks = await this.taskService.getAllTasks(limit, offset);
      this.sendSuccess(res, tasks, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PUT /api/tasks/:id
   * Update a task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, deadline, task_type_id } = req.body;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (deadline) updates.deadline = new Date(deadline);
      if (task_type_id) updates.task_type_id = BigInt(task_type_id);

      const task = await this.taskService.updateTask(BigInt(id), updates);
      this.sendSuccess(res, task, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const result = await this.taskService.deleteTask(BigInt(id));
      this.sendSuccess(res, { deleted: result }, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Status Management ============

  /**
   * PATCH /api/tasks/:id/status
   * Change task status
   */
  async changeTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status_id, changed_by } = req.body;

      if (!id || !status_id || !changed_by) {
        this.sendError(res, 'Task ID, status_id, and changed_by are required', 400);
        return;
      }

      // Use automation service to handle status change with automatic updates
      const task = await TaskAutomationService.handleTaskStatusChange(
        BigInt(id),
        BigInt(status_id),
        BigInt(changed_by)
      );

      this.sendSuccess(res, task, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/statuses
   * Get all available task statuses
   */
  async getTaskStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = await this.taskService.getTaskStatuses();
      this.sendSuccess(res, statuses, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/history
   * Get task status change history
   */
  async getTaskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const history = await this.taskService.getTaskHistory(BigInt(id));
      this.sendSuccess(res, history, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Assignment Management ============

  /**
   * POST /api/tasks/:id/assign
   * Assign task to a user
   */
  async assignTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assigned_to, assigned_by } = req.body;

      if (!id || !assigned_to || !assigned_by) {
        this.sendError(res, 'Task ID, assigned_to, and assigned_by are required', 400);
        return;
      }

      // Use automation service to handle assignment with automatic KPI update
      await TaskAutomationService.handleTaskAssignment(
        BigInt(id),
        BigInt(assigned_to),
        BigInt(assigned_by)
      );

      // Get the assignment record
      const assignment = await this.taskService.getTaskAssignments(BigInt(id));

      this.sendSuccess(res, assignment[0], 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/tasks/:id/reassign
   * Reassign task to a different user
   */
  async reassignTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { new_user_id, assigned_by } = req.body;

      if (!id || !new_user_id || !assigned_by) {
        this.sendError(res, 'Task ID, new_user_id, and assigned_by are required', 400);
        return;
      }

      const assignment = await this.taskService.reassignTask(
        BigInt(id),
        BigInt(new_user_id),
        BigInt(assigned_by)
      );

      this.sendSuccess(res, assignment, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/assignments
   * Get task assignment history
   */
  async getTaskAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const assignments = await this.taskService.getTaskAssignments(BigInt(id));
      this.sendSuccess(res, assignments, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Comments & Attachments ============

  /**
   * POST /api/tasks/:id/comments
   * Add comment to task
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user_id, comment } = req.body;

      if (!id || !user_id || !comment) {
        this.sendError(res, 'Task ID, user_id, and comment are required', 400);
        return;
      }

      const result = await this.taskService.addComment(
        BigInt(id),
        BigInt(user_id),
        comment
      );

      this.sendSuccess(res, result, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/comments
   * Get task comments
   */
  async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const comments = await this.taskService.getComments(BigInt(id));
      this.sendSuccess(res, comments, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/tasks/:id/attachments
   * Add attachment to task
   */
  async addAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user_id, file_url, file_type } = req.body;

      if (!id || !user_id || !file_url || !file_type) {
        this.sendError(res, 'Task ID, user_id, file_url, and file_type are required', 400);
        return;
      }

      const attachment = await this.taskService.addAttachment(
        BigInt(id),
        BigInt(user_id),
        file_url,
        file_type
      );

      this.sendSuccess(res, attachment, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/attachments
   * Get task attachments
   */
  async getAttachments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const attachments = await this.taskService.getAttachments(BigInt(id));
      this.sendSuccess(res, attachments, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Relations & Dependencies ============

  /**
   * POST /api/tasks/:id/relations
   * Add relation/dependency to task
   */
  async addRelation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { related_task_id, relation_type } = req.body;

      if (!id || !related_task_id || !relation_type) {
        this.sendError(res, 'Task ID, related_task_id, and relation_type are required', 400);
        return;
      }

      const relation = await this.taskService.addRelation(
        BigInt(id),
        BigInt(related_task_id),
        relation_type
      );

      this.sendSuccess(res, relation, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/relations
   * Get task relations
   */
  async getRelations(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const relations = await this.taskService.getRelations(BigInt(id));
      this.sendSuccess(res, relations, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/dependency
   * Validate task dependency
   */
  async validateTaskDependency(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const result = await this.taskService.validateTaskDependency(BigInt(id));
      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Filtering & Search ============

  /**
   * GET /api/tasks/order/:orderId
   * Get tasks by order
   */
  async getTasksByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!orderId) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const tasks = await this.taskService.getTasksByOrder(BigInt(orderId), limit, offset);
      this.sendSuccess(res, tasks, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/assignee/:userId
   * Get tasks by assignee
   */
  async getTasksByAssignee(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!userId) {
        this.sendError(res, 'User ID is required', 400);
        return;
      }

      const tasks = await this.taskService.getTasksByAssignee(BigInt(userId), limit, offset);
      this.sendSuccess(res, tasks, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/status/:statusId
   * Get tasks by status
   */
  async getTasksByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { statusId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!statusId) {
        this.sendError(res, 'Status ID is required', 400);
        return;
      }

      const tasks = await this.taskService.getTasksByStatus(BigInt(statusId), limit, offset);
      this.sendSuccess(res, tasks, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/overdue
   * Get overdue tasks
   */
  async getOverdueTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.taskService.getOverdueTasks();
      this.sendSuccess(res, tasks, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Business Logic ============

  /**
   * GET /api/tasks/:id/progress
   * Calculate task progress
   */
  async calculateTaskProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const progress = await this.taskService.calculateTaskProgress(BigInt(id));
      this.sendSuccess(res, progress, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/can-delete
   * Check if task can be deleted
   */
  async canDeleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const result = await this.taskService.canDeleteTask(BigInt(id));
      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/tasks/bulk-assign
   * Bulk assign tasks to a user
   */
  async bulkAssignTasks(req: Request, res: Response): Promise<void> {
    try {
      const { task_ids, user_id, assigned_by } = req.body;

      if (!task_ids || !Array.isArray(task_ids) || !user_id || !assigned_by) {
        this.sendError(res, 'task_ids (array), user_id, and assigned_by are required', 400);
        return;
      }

      const result = await this.taskService.bulkAssignTasks(
        task_ids.map((id: string) => BigInt(id)),
        BigInt(user_id),
        BigInt(assigned_by)
      );

      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/tasks/bulk-status
   * Bulk change status for multiple tasks
   */
  async bulkChangeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { task_ids, status_id, changed_by } = req.body;

      if (!task_ids || !Array.isArray(task_ids) || !status_id || !changed_by) {
        this.sendError(res, 'task_ids (array), status_id, and changed_by are required', 400);
        return;
      }

      const result = await this.taskService.bulkChangeStatus(
        task_ids.map((id: string) => BigInt(id)),
        BigInt(status_id),
        BigInt(changed_by)
      );

      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Helper Methods ============

  /**
   * GET /api/tasks/:id/kpi
   * Get task KPI
   */
  async getTaskKPI(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const kpi = await KPIService.getTaskKPI(BigInt(id));

      if (!kpi) {
        this.sendError(res, 'KPI not found for this task', 404);
        return;
      }

      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/tasks/:id/details
   * Get task with all relations and KPI
   */
  async getTaskWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const task = await TaskAutomationService.getTaskWithRelations(BigInt(id));

      if (!task) {
        this.sendError(res, 'Task not found', 404);
        return;
      }

      this.sendSuccess(res, task, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Helper Methods ============

  /**
   * Send success response
   */
  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   */
  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
