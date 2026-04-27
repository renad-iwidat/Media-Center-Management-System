import { ShootingModel } from '../../models/management/Shooting';
import { OrderModel } from '../../models/management/Order';
import { TaskModel } from '../../models/management/Task';
import { Shooting, CreateShootingDTO, UpdateShootingDTO } from '../../types/management';
import pool from '../../config/database';

export class ShootingService {

  // ============ CRUD ============

  async createShooting(data: CreateShootingDTO): Promise<Shooting> {
    this.validateShootingData(data);

    // Verify order exists
    const order = await OrderModel.findById(data.order_id);
    if (!order) {
      throw new Error(`Order not found: ${data.order_id}`);
    }

    // Verify task exists if provided
    if (data.task_id) {
      const task = await TaskModel.findById(data.task_id);
      if (!task) {
        throw new Error(`Task not found: ${data.task_id}`);
      }
      // Verify task belongs to the order
      if (task.order_id && task.order_id !== data.order_id) {
        throw new Error('Task does not belong to the specified order');
      }
    }

    return ShootingModel.create(data);
  }

  async getShooting(id: bigint): Promise<Shooting> {
    const shooting = await ShootingModel.findById(id);
    if (!shooting) {
      throw new Error(`Shooting not found: ${id}`);
    }
    return shooting;
  }

  async getAllShootings(limit: number = 10, offset: number = 0): Promise<Shooting[]> {
    return ShootingModel.findAll(limit, offset);
  }

  async updateShooting(id: bigint, data: UpdateShootingDTO): Promise<Shooting> {
    await this.getShooting(id); // verify exists

    if (data.start_time && data.end_time) {
      if (new Date(data.start_time) >= new Date(data.end_time)) {
        throw new Error('Start time must be before end time');
      }
    }

    const updated = await ShootingModel.update(id, data as Partial<Shooting>);
    if (!updated) {
      throw new Error(`Failed to update shooting: ${id}`);
    }
    return updated;
  }

  async deleteShooting(id: bigint): Promise<boolean> {
    await this.getShooting(id); // verify exists
    return ShootingModel.delete(id);
  }

  // ============ Filtering ============

  async getShootingsByOrder(orderId: bigint): Promise<Shooting[]> {
    return ShootingModel.findByOrder(orderId);
  }

  async getShootingsByTask(taskId: bigint): Promise<Shooting[]> {
    return ShootingModel.findByTask(taskId);
  }

  async getShootingsByCreator(userId: bigint, limit: number = 10, offset: number = 0): Promise<Shooting[]> {
    return ShootingModel.findByCreator(userId, limit, offset);
  }

  // ============ Validation ============

  private validateShootingData(data: CreateShootingDTO): void {
    const errors: string[] = [];

    if (!data.order_id) {
      errors.push('Order ID is required');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Location is required');
    }

    if (!data.start_time) {
      errors.push('Start time is required');
    }

    if (!data.created_by) {
      errors.push('Created by is required');
    }

    if (data.start_time && data.end_time) {
      if (new Date(data.start_time) >= new Date(data.end_time)) {
        errors.push('Start time must be before end time');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  // ============ Enriched Views ============

  /**
   * Get shooting with full context — single optimized query
   * Returns: shooting + order title + task status + content produced
   */
  async getShootingEnriched(id: bigint): Promise<any> {
    const result = await pool.query(
      `SELECT
         s.*,
         o.title as order_title,
         os.name as order_status,
         t.title as task_title,
         ts.name as task_status,
         u.name as created_by_name,
         (SELECT COUNT(*) FROM content c
          WHERE c.owner_type = 'shooting' AND c.owner_id = s.id
         ) as content_count
       FROM shootings s
       LEFT JOIN orders o ON s.order_id = o.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN tasks t ON s.task_id = t.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      status: row.task_status || row.order_status || 'pending',
      content_count: parseInt(row.content_count) || 0,
    };
  }

  /**
   * Get all shootings enriched — batch optimized
   */
  async getAllShootingsEnriched(limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         s.*,
         o.title as order_title,
         os.name as order_status,
         t.title as task_title,
         ts.name as task_status,
         u.name as created_by_name,
         (SELECT COUNT(*) FROM content c
          WHERE c.owner_type = 'shooting' AND c.owner_id = s.id
         ) as content_count
       FROM shootings s
       LEFT JOIN orders o ON s.order_id = o.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN tasks t ON s.task_id = t.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN users u ON s.created_by = u.id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => ({
      ...row,
      status: row.task_status || row.order_status || 'pending',
      content_count: parseInt(row.content_count) || 0,
    }));
  }

  /**
   * Get shooting full details — shooting + content produced from it
   */
  async getShootingFull(id: bigint): Promise<any> {
    const enriched = await this.getShootingEnriched(id);
    if (!enriched) return null;

    const contentResult = await pool.query(
      `SELECT c.*, ct.name as type_name
       FROM content c
       LEFT JOIN content_types ct ON c.content_type_id = ct.id
       WHERE c.owner_type = 'shooting' AND c.owner_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    return {
      ...enriched,
      content: contentResult.rows,
    };
  }
}
