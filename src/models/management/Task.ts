import pool from '../../config/database';
import { Task, TaskStatus, TaskType, TaskHistory, TaskAssignment, TaskComment, TaskAttachment, TaskRelation } from '../../types/management';

export class TaskModel {
  static async findById(id: bigint): Promise<Task | null> {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByIdWithDetails(id: bigint): Promise<any | null> {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findAllWithDetails(limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as assigned_to_name,
        o.title as order_title,
        ts.name as status_name,
        pl.name as priority_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN orders o ON t.order_id = o.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       ORDER BY t.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findByOrder(orderId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE order_id = $1 ORDER BY sequence_order ASC LIMIT $2 OFFSET $3',
      [orderId, limit, offset]
    );
    return result.rows;
  }

  static async findByOrderWithDetails(orderId: bigint, limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as assigned_to_name,
        o.title as order_title,
        ts.name as status_name,
        pl.name as priority_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN orders o ON t.order_id = o.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       WHERE t.order_id = $1 
       ORDER BY t.sequence_order ASC 
       LIMIT $2 OFFSET $3`,
      [orderId, limit, offset]
    );
    return result.rows;
  }

  static async findByAssignee(userId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByAssigneeWithDetails(userId: bigint, limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as assigned_to_name,
        o.title as order_title,
        ts.name as status_name,
        pl.name as priority_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN orders o ON t.order_id = o.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE status_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [statusId, limit, offset]
    );
    return result.rows;
  }

  static async create(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const result = await pool.query(
      `INSERT INTO tasks (order_id, title, description, assigned_to, status_id, priority_id, deadline, sequence_order, task_type_id, started_at, completed_at, is_overdue, estimated_duration, actual_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [task.order_id, task.title, task.description, task.assigned_to, task.status_id, task.priority_id, task.deadline, task.sequence_order, task.task_type_id, task.started_at, task.completed_at, task.is_overdue, task.estimated_duration, task.actual_duration]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Task>): Promise<Task | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Task]);
    values.push(id);

    const result = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async countAll(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM tasks');
    return parseInt(result.rows[0].count);
  }

  static async searchWithDetails(
    limit: number = 10,
    offset: number = 0,
    search: string = '',
    order_id?: bigint,
    assigned_to?: bigint,
    status_id?: bigint
  ): Promise<{ rows: any[]; total: number }> {
    let baseQuery = `FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     LEFT JOIN orders o ON t.order_id = o.id
     LEFT JOIN task_statuses ts ON t.status_id = ts.id
     LEFT JOIN priority_levels pl ON t.priority_id = pl.id
     WHERE 1=1`;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      baseQuery += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (order_id) {
      baseQuery += ` AND t.order_id = $${paramIndex}`;
      params.push(order_id);
      paramIndex++;
    }
    if (assigned_to) {
      baseQuery += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }
    if (status_id) {
      baseQuery += ` AND t.status_id = $${paramIndex}`;
      params.push(status_id);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT t.*, u.name as assigned_to_name, o.title as order_title, ts.name as status_name, pl.name as priority_name
       ${baseQuery} ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { rows: dataResult.rows, total };
  }

  static async getStatuses(): Promise<TaskStatus[]> {
    const result = await pool.query('SELECT * FROM task_statuses');
    return result.rows;
  }

  static async getOverdueWithDetails(): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        t.*,
        u.name as assigned_to_name,
        o.title as order_title,
        ts.name as status_name,
        pl.name as priority_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN orders o ON t.order_id = o.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       WHERE t.deadline < NOW() 
       AND t.status_id NOT IN (SELECT id FROM task_statuses WHERE name IN ('Done', 'Cancelled'))
       ORDER BY t.deadline ASC`
    );
    return result.rows;
  }

  static async getTypes(): Promise<TaskType[]> {
    const result = await pool.query('SELECT * FROM task_types');
    return result.rows;
  }

  static async getHistory(taskId: bigint): Promise<TaskHistory[]> {
    const result = await pool.query(
      'SELECT * FROM task_history WHERE task_id = $1 ORDER BY changed_at DESC',
      [taskId]
    );
    return result.rows;
  }

  static async addHistory(history: Omit<TaskHistory, 'id' | 'changed_at'>): Promise<TaskHistory> {
    const result = await pool.query(
      `INSERT INTO task_history (task_id, old_status_id, changed_by, new_status_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [history.task_id, history.old_status_id, history.changed_by, history.new_status_id]
    );
    return result.rows[0];
  }

  static async getAssignments(taskId: bigint): Promise<TaskAssignment[]> {
    const result = await pool.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 ORDER BY assigned_at DESC',
      [taskId]
    );
    return result.rows;
  }

  static async addAssignment(assignment: Omit<TaskAssignment, 'id' | 'assigned_at'>): Promise<TaskAssignment> {
    const result = await pool.query(
      `INSERT INTO task_assignments (task_id, assigned_to, assigned_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [assignment.task_id, assignment.assigned_to, assignment.assigned_by]
    );
    return result.rows[0];
  }

  static async getComments(taskId: bigint): Promise<TaskComment[]> {
    const result = await pool.query(
      'SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at DESC',
      [taskId]
    );
    return result.rows;
  }

  static async addComment(comment: Omit<TaskComment, 'id' | 'created_at'>): Promise<TaskComment> {
    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [comment.task_id, comment.user_id, comment.comment]
    );
    return result.rows[0];
  }

  static async getAttachments(taskId: bigint): Promise<TaskAttachment[]> {
    const result = await pool.query(
      'SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at DESC',
      [taskId]
    );
    return result.rows;
  }

  static async addAttachment(attachment: Omit<TaskAttachment, 'id' | 'created_at'>): Promise<TaskAttachment> {
    const result = await pool.query(
      `INSERT INTO task_attachments (task_id, file_url, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [attachment.task_id, attachment.file_url, attachment.file_type, attachment.uploaded_by]
    );
    return result.rows[0];
  }

  static async getRelations(taskId: bigint): Promise<TaskRelation[]> {
    const result = await pool.query(
      'SELECT * FROM task_relations WHERE task_id = $1 OR related_to_id = $1',
      [taskId]
    );
    return result.rows;
  }

  static async addRelation(relation: Omit<TaskRelation, 'id'>): Promise<TaskRelation> {
    const result = await pool.query(
      `INSERT INTO task_relations (task_id, related_to_type, related_to_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [relation.task_id, relation.related_to_type, relation.related_to_id]
    );
    return result.rows[0];
  }
}
