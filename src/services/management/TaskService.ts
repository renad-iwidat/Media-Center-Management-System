import { TaskModel } from '../../models/management/Task';
import { OrderModel } from '../../models/management/Order';
import { Task, TaskStatus, TaskHistory, TaskAssignment, TaskComment, TaskAttachment, TaskRelation } from '../../types/management';
import { TaskValidator } from './validators/TaskValidator';
import { DependencyHelper } from './helpers/DependencyHelper';
import { OrderStatusHelper } from './helpers/OrderStatusHelper';

export class TaskService {
  // ============ CRUD Operations ============

  async createTask(data: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    this.validateTaskData(data);
    
    // Validate order deadline
    if (data.order_id) {
      await this.validateTaskDeadlineAgainstOrder(data.order_id, data.deadline);
    }

    return await TaskModel.create(data);
  }

  async getTask(id: bigint): Promise<Task> {
    const task = await TaskModel.findById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    return task;
  }

  async getAllTasks(limit: number = 10, offset: number = 0): Promise<Task[]> {
    return await TaskModel.findAll(limit, offset);
  }

  async updateTask(id: bigint, updates: Partial<Task>): Promise<Task> {
    await this.getTask(id); // Verify exists
    this.validateTaskData(updates);

    const updated = await TaskModel.update(id, updates);
    if (!updated) {
      throw new Error(`Failed to update task: ${id}`);
    }
    return updated;
  }

  async deleteTask(id: bigint): Promise<boolean> {
    const canDelete = await this.canDeleteTask(id);
    if (!canDelete.canDelete) {
      throw new Error(`Cannot delete task: ${canDelete.reason}`);
    }
    return await TaskModel.delete(id);
  }

  // ============ Status Management ============

  async changeTaskStatus(
    taskId: bigint,
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<Task> {
    const task = await this.getTask(taskId);

    // Validate status transition using validator
    if (!TaskValidator.isValidStatusTransition(task.status_id, newStatusId)) {
      throw new Error(
        TaskValidator.getTransitionError(task.status_id, newStatusId)
      );
    }

    // Check dependencies if moving to In Progress
    if (newStatusId?.toString() === 'In Progress') {
      const dependency = await DependencyHelper.canTaskStart(taskId);
      if (!dependency.canStart) {
        throw new Error(
          `Task blocked by: ${dependency.blockedBy.map(t => t.title).join(', ')}`
        );
      }
    }

    // Update task status
    const updated = await TaskModel.update(taskId, { status_id: newStatusId });
    if (!updated) {
      throw new Error(`Failed to update task status: ${taskId}`);
    }

    // Record in history
    await TaskModel.addHistory({
      task_id: taskId,
      old_status_id: task.status_id,
      changed_by: changedBy,
      new_status_id: newStatusId,
    });

    // Check if all tasks in order are done and update order status
    if (task.order_id) {
      await this.checkAndUpdateOrderStatus(task.order_id, changedBy);
    }

    return updated;
  }

  async getTaskStatuses(): Promise<TaskStatus[]> {
    return await TaskModel.getStatuses();
  }

  async getTaskHistory(taskId: bigint): Promise<TaskHistory[]> {
    return await TaskModel.getHistory(taskId);
  }

  // ============ Assignment Management ============

  async assignTask(
    taskId: bigint,
    userId: bigint,
    assignedBy: bigint
  ): Promise<TaskAssignment> {
    await this.getTask(taskId); // Verify task exists

    return await TaskModel.addAssignment({
      task_id: taskId,
      assigned_to: userId,
      assigned_by: assignedBy,
    });
  }

  async reassignTask(
    taskId: bigint,
    newUserId: bigint,
    assignedBy: bigint
  ): Promise<TaskAssignment> {
    return await this.assignTask(taskId, newUserId, assignedBy);
  }

  async getTaskAssignments(taskId: bigint): Promise<TaskAssignment[]> {
    return await TaskModel.getAssignments(taskId);
  }

  // ============ Comments & Attachments ============

  async addComment(
    taskId: bigint,
    userId: bigint,
    comment: string
  ): Promise<TaskComment> {
    await this.getTask(taskId); // Verify task exists

    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    return await TaskModel.addComment({
      task_id: taskId,
      user_id: userId,
      comment,
    });
  }

  async getComments(taskId: bigint): Promise<TaskComment[]> {
    return await TaskModel.getComments(taskId);
  }

  async addAttachment(
    taskId: bigint,
    userId: bigint,
    fileUrl: string,
    fileType: string
  ): Promise<TaskAttachment> {
    await this.getTask(taskId); // Verify task exists

    if (!fileUrl || !fileType) {
      throw new Error('File URL and type are required');
    }

    return await TaskModel.addAttachment({
      task_id: taskId,
      file_url: fileUrl,
      file_type: fileType,
      uploaded_by: userId,
    });
  }

  async getAttachments(taskId: bigint): Promise<TaskAttachment[]> {
    return await TaskModel.getAttachments(taskId);
  }

  // ============ Task Relations & Dependencies ============

  async addRelation(
    taskId: bigint,
    relatedTaskId: bigint,
    relationType: string
  ): Promise<TaskRelation> {
    await this.getTask(taskId);
    await this.getTask(relatedTaskId);

    // Validate no circular dependencies
    const circularCheck = await DependencyHelper.validateNoCircularDependency(
      taskId,
      relatedTaskId
    );

    if (!circularCheck.isValid) {
      throw new Error(circularCheck.reason);
    }

    return await TaskModel.addRelation({
      task_id: taskId,
      related_to_id: relatedTaskId,
      related_to_type: relationType,
    });
  }

  async getRelations(taskId: bigint): Promise<TaskRelation[]> {
    return await TaskModel.getRelations(taskId);
  }

  async validateTaskDependency(taskId: bigint): Promise<{
    canStart: boolean;
    blockedBy: Task[];
    reason?: string;
  }> {
    return await DependencyHelper.canTaskStart(taskId);
  }

  // ============ Filtering & Search ============

  async getTasksByOrder(orderId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    return await TaskModel.findByOrder(orderId, limit, offset);
  }

  async getTasksByAssignee(userId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    return await TaskModel.findByAssignee(userId, limit, offset);
  }

  async getTasksByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    return await TaskModel.findByStatus(statusId, limit, offset);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const allTasks = await this.getAllTasks(10000, 0);
    const now = new Date();

    return allTasks.filter(
      t => t.deadline && 
           new Date(t.deadline) < now && 
           !['Done', 'Cancelled'].includes(t.status_id?.toString() || '')
    );
  }

  // ============ Business Logic ============

  async calculateTaskProgress(taskId: bigint): Promise<{
    status: string;
    percentage: number;
  }> {
    const task = await this.getTask(taskId);
    const statusPercentages: Record<string, number> = {
      'Pending': 0,
      'In Progress': 50,
      'Review': 75,
      'Done': 100,
      'Cancelled': 0,
    };

    const status = task.status_id?.toString() || 'Pending';
    const percentage = statusPercentages[status] || 0;

    return { status, percentage };
  }

  async canDeleteTask(taskId: bigint): Promise<{
    canDelete: boolean;
    reason?: string;
  }> {
    const task = await this.getTask(taskId);

    // Check status
    const nonDeletableStatuses = ['In Progress', 'Review'];
    if (nonDeletableStatuses.includes(task.status_id?.toString() || '')) {
      return {
        canDelete: false,
        reason: `Cannot delete task with status: ${task.status_id}`,
      };
    }

    // Check for dependent tasks
    const relations = await this.getRelations(taskId);
    const dependentTasks = relations.filter(r => r.related_to_type === 'depends_on');

    if (dependentTasks.length > 0) {
      return {
        canDelete: false,
        reason: `Task has ${dependentTasks.length} dependent tasks`,
      };
    }

    return { canDelete: true };
  }

  async bulkAssignTasks(
    taskIds: bigint[],
    userId: bigint,
    assignedBy: bigint
  ): Promise<{
    success: number;
    failed: number;
    errors: { taskId: bigint; error: string }[];
  }> {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const taskId of taskIds) {
      try {
        await this.assignTask(taskId, userId, assignedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async bulkChangeStatus(
    taskIds: bigint[],
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<{
    success: number;
    failed: number;
    errors: { taskId: bigint; error: string }[];
  }> {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const taskId of taskIds) {
      try {
        await this.changeTaskStatus(taskId, newStatusId, changedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async getTaskWithDetails(taskId: bigint): Promise<any> {
    const task = await this.getTask(taskId);
    const comments = await this.getComments(taskId);
    const attachments = await this.getAttachments(taskId);
    const relations = await this.getRelations(taskId);
    const assignments = await this.getTaskAssignments(taskId);
    const progress = await this.calculateTaskProgress(taskId);
    const history = await this.getTaskHistory(taskId);

    return {
      ...task,
      comments,
      attachments,
      relations,
      assignments,
      progress,
      history,
    };
  }

  // ============ Private Methods ============

  private validateTaskData(data: any): void {
    const errors = TaskValidator.validateTaskData(data);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  private isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    return TaskValidator.isValidStatusTransition(currentStatus, newStatus);
  }

  private async validateTaskDeadlineAgainstOrder(
    orderId: bigint,
    taskDeadline?: Date
  ): Promise<void> {
    if (!taskDeadline) return;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.deadline && new Date(taskDeadline) > new Date(order.deadline)) {
      throw new Error(
        `Task deadline cannot exceed order deadline: ${order.deadline}`
      );
    }
  }

  private async checkAndUpdateOrderStatus(
    orderId: bigint,
    changedBy: bigint
  ): Promise<void> {
    const tasks = await this.getTasksByOrder(orderId, 1000, 0);
    
    // Calculate appropriate order status based on tasks
    const statusInfo = await OrderStatusHelper.calculateOrderStatus(tasks);
    const order = await OrderModel.findById(orderId);
    
    if (!order) return;

    const shouldUpdateInfo = await OrderStatusHelper.shouldUpdateOrderStatus(order.status_id, tasks);

    if (shouldUpdateInfo.shouldUpdate && shouldUpdateInfo.newStatusId) {
      const newStatusId = shouldUpdateInfo.newStatusId;

      // Update order status
      await OrderModel.update(orderId, { status_id: newStatusId });

      // Record in history
      await OrderModel.addHistory({
        order_id: orderId,
        changed_by: changedBy,
        old_status_id: order.status_id,
        new_status_id: newStatusId,
      });
    }
  }
}
