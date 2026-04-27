import pool from '../../config/database';
import { Task } from '../../types/management';
import { KPIService } from './KPIService';
import { NotificationService } from './NotificationService';

export class TaskAutomationService {
  /**
   * Handle task status change
   * Automatically updates timestamps and calculates KPI
   */
  static async handleTaskStatusChange(
    taskId: bigint,
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<Task> {
    // Get current task
    const taskResult = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error(`Task ${taskId} not found`);
    }

    const task = taskResult.rows[0];
    const oldStatusId = task.status_id;

    // Get status names
    const newStatusResult = await pool.query(
      `SELECT name FROM task_statuses WHERE id = $1`,
      [newStatusId]
    );

    const newStatusName = newStatusResult.rows[0]?.name;

    let updates: any = { status_id: newStatusId };

    // Handle "In Progress" status
    if (newStatusName === 'In Progress' && !task.started_at) {
      updates.started_at = new Date();
    }

    // Handle "Done" status
    if (newStatusName === 'Done' && !task.completed_at) {
      updates.completed_at = new Date();

      // Calculate actual duration
      if (task.started_at) {
        const startedAt = new Date(task.started_at);
        const completedAt = new Date();
        const durationMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);
        updates.actual_duration = durationMinutes;
      }

      // Check if overdue
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        const completedAt = new Date();
        updates.is_overdue = completedAt > deadline;
      }
    }

    // Update task
    const updateFields = Object.keys(updates);
    const setClause = updateFields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = updateFields.map(field => updates[field]);
    values.push(taskId);

    const updatedTaskResult = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${updateFields.length + 1} RETURNING *`,
      values
    );

    const updatedTask = updatedTaskResult.rows[0];

    // Add to task_history
    await pool.query(
      `INSERT INTO task_history (task_id, old_status_id, new_status_id, changed_by, changed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [taskId, oldStatusId, newStatusId, changedBy]
    );

    // Calculate KPI if task is completed
    if (newStatusName === 'Done') {
      await KPIService.calculateTaskKPI(taskId);

      // Also update order KPI if task has an order
      if (updatedTask.order_id) {
        await KPIService.calculateOrderKPI(updatedTask.order_id);
      }

      // Update user KPI if task is assigned
      if (updatedTask.assigned_to) {
        await KPIService.calculateUserKPI(updatedTask.assigned_to);
      }
    }

    // إشعار لصاحب المهمة عند تغيير الحالة
    if (updatedTask.assigned_to && String(updatedTask.assigned_to) !== String(changedBy)) {
      try {
        await NotificationService.notifyTaskStatusChanged(taskId, updatedTask.title, newStatusName || '', updatedTask.assigned_to);
      } catch { /* لا نوقف العملية إذا فشل الإشعار */ }
    }

    return updatedTask;
  }

  /**
   * Handle task assignment
   * Automatically updates user KPI
   */
  static async handleTaskAssignment(
    taskId: bigint,
    assignedTo: bigint,
    assignedBy: bigint
  ): Promise<void> {
    // Add to task_assignments
    await pool.query(
      `INSERT INTO task_assignments (task_id, assigned_to, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())`,
      [taskId, assignedTo, assignedBy]
    );

    // Update user KPI
    await KPIService.calculateUserKPI(assignedTo);

    // إشعار للموظف المعيّن
    try {
      const taskResult = await pool.query('SELECT title FROM tasks WHERE id = $1', [taskId]);
      const assignerResult = await pool.query('SELECT name FROM users WHERE id = $1', [assignedBy]);
      const taskTitle = taskResult.rows[0]?.title || '';
      const assignerName = assignerResult.rows[0]?.name || '';
      await NotificationService.notifyTaskAssigned(taskId, taskTitle, assignedTo, assignerName);
    } catch { /* لا نوقف العملية إذا فشل الإشعار */ }
  }

  /**
   * Handle content upload for a task
   * Automatically links content to task and updates KPI
   */
  static async handleContentUpload(
    contentId: bigint,
    taskId: bigint,
    linkedBy: bigint,
    usageType: string = 'output'
  ): Promise<void> {
    // Update content with task_id
    await pool.query(
      `UPDATE content SET task_id = $1 WHERE id = $2`,
      [taskId, contentId]
    );

    // Link content to task
    await pool.query(
      `INSERT INTO content_tasks (content_id, task_id, usage_type, linked_at, linked_by)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (content_id, task_id) DO UPDATE SET
         usage_type = $3,
         linked_at = NOW(),
         linked_by = $4`,
      [contentId, taskId, usageType, linkedBy]
    );

    // Update task KPI
    await KPIService.calculateTaskKPI(taskId);

    // Get task to update order KPI
    const taskResult = await pool.query(
      `SELECT order_id, assigned_to FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];

      // Update order KPI if task has an order
      if (task.order_id) {
        await KPIService.calculateOrderKPI(task.order_id);
      }

      // Update user KPI if task is assigned
      if (task.assigned_to) {
        await KPIService.calculateUserKPI(task.assigned_to);
      }

      // إشعار لصاحب الأوردر عند رفع محتوى
      if (task.order_id) {
        try {
          const orderResult = await pool.query('SELECT created_by FROM orders WHERE id = $1', [task.order_id]);
          const contentResult2 = await pool.query('SELECT title FROM content WHERE id = $1', [contentId]);
          if (orderResult.rows[0]?.created_by) {
            await NotificationService.notifyContentUploaded(contentId, contentResult2.rows[0]?.title || '', task.order_id, orderResult.rows[0].created_by);
          }
        } catch { /* لا نوقف العملية إذا فشل الإشعار */ }
      }
    }
  }

  /**
   * Handle content linking to task (as input/reference)
   * Automatically creates content_tasks entry
   */
  static async handleContentLinking(
    contentId: bigint,
    taskId: bigint,
    usageType: string,
    linkedBy: bigint,
    notes?: string
  ): Promise<void> {
    // Link content to task
    await pool.query(
      `INSERT INTO content_tasks (content_id, task_id, usage_type, linked_at, linked_by, notes)
       VALUES ($1, $2, $3, NOW(), $4, $5)
       ON CONFLICT (content_id, task_id) DO UPDATE SET
         usage_type = $3,
         linked_at = NOW(),
         linked_by = $4,
         notes = $5`,
      [contentId, taskId, usageType, linkedBy, notes]
    );
  }

  /**
   * Handle task relation creation
   * Automatically adds relation with metadata
   */
  static async handleTaskRelation(
    taskId: bigint,
    relatedToId: bigint,
    relationType: string,
    description?: string,
    createdBy?: bigint
  ): Promise<void> {
    await pool.query(
      `INSERT INTO task_relations (task_id, related_to_id, related_to_type, relation_type, description, is_active, created_at, created_by)
       VALUES ($1, $2, 'task', $3, $4, true, NOW(), $5)`,
      [taskId, relatedToId, relationType, description, createdBy]
    );
  }

  /**
   * Archive content
   * Automatically sets archive flags and timestamps
   */
  static async handleContentArchive(
    contentId: bigint,
    archivedBy: bigint
  ): Promise<void> {
    // Update content
    await pool.query(
      `UPDATE content SET is_archived = true, archived_at = NOW() WHERE id = $1`,
      [contentId]
    );

    // Get content to find associated task
    const contentResult = await pool.query(
      `SELECT task_id FROM content WHERE id = $1`,
      [contentId]
    );

    if (contentResult.rows.length > 0 && contentResult.rows[0].task_id) {
      const taskId = contentResult.rows[0].task_id;

      // Update task KPI
      await KPIService.calculateTaskKPI(taskId);

      // Get task to update order KPI
      const taskResult = await pool.query(
        `SELECT order_id FROM tasks WHERE id = $1`,
        [taskId]
      );

      if (taskResult.rows.length > 0 && taskResult.rows[0].order_id) {
        await KPIService.calculateOrderKPI(taskResult.rows[0].order_id);
      }
    }
  }

  /**
   * Get task with all related data
   */
  static async getTaskWithRelations(taskId: bigint): Promise<any> {
    const taskResult = await pool.query(
      `SELECT t.*, ts.name as status_name, pl.name as priority_name
       FROM tasks t
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return null;
    }

    const task = taskResult.rows[0];

    // Get related content
    const contentResult = await pool.query(
      `SELECT c.*, ct.usage_type, ct.linked_at, ct.linked_by
       FROM content c
       JOIN content_tasks ct ON c.id = ct.content_id
       WHERE ct.task_id = $1`,
      [taskId]
    );

    // Get task relations
    const relationsResult = await pool.query(
      `SELECT * FROM task_relations WHERE task_id = $1 AND is_active = true`,
      [taskId]
    );

    // Get task assignments
    const assignmentsResult = await pool.query(
      `SELECT ta.*, u.name as assigned_to_name, u2.name as assigned_by_name
       FROM task_assignments ta
       LEFT JOIN users u ON ta.assigned_to = u.id
       LEFT JOIN users u2 ON ta.assigned_by = u2.id
       WHERE ta.task_id = $1
       ORDER BY ta.assigned_at DESC`,
      [taskId]
    );

    // Get task KPI
    const kpiResult = await pool.query(
      `SELECT * FROM task_kpi WHERE task_id = $1`,
      [taskId]
    );

    return {
      ...task,
      content: contentResult.rows,
      relations: relationsResult.rows,
      assignments: assignmentsResult.rows,
      kpi: kpiResult.rows[0] || null
    };
  }
}
