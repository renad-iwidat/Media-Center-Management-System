import pool from '../../config/database';
import { SocketService } from './SocketService';

export class NotificationService {

  // ============ إنشاء إشعارات ============

  static async create(data: {
    user_id: bigint;
    type: string;
    title: string;
    message?: string;
    entity_type?: string;
    entity_id?: bigint;
  }): Promise<any> {
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) ' +
      'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [data.user_id, data.type, data.title, data.message || null, data.entity_type || null, data.entity_id || null]
    );

    const notification = result.rows[0];

    // إرسال لحظي عبر الويب سوكت
    SocketService.notifyUser(data.user_id, notification);

    return notification;
  }

  /**
   * إشعار عند تعيين مهمة
   */
  static async notifyTaskAssigned(taskId: bigint, taskTitle: string, assignedTo: bigint, assignedByName: string): Promise<void> {
    await this.create({
      user_id: assignedTo,
      type: 'task_assigned',
      title: 'تم تعيين مهمة جديدة لك',
      message: 'المهمة: ' + taskTitle + ' — بواسطة: ' + assignedByName,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  /**
   * إشعار عند تحديث حالة مهمة
   */
  static async notifyTaskStatusChanged(taskId: bigint, taskTitle: string, newStatus: string, assignedTo: bigint): Promise<void> {
    await this.create({
      user_id: assignedTo,
      type: 'task_status_changed',
      title: 'تم تحديث حالة المهمة',
      message: 'المهمة: ' + taskTitle + ' — الحالة الجديدة: ' + newStatus,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  /**
   * إشعار عند رفع محتوى
   */
  static async notifyContentUploaded(contentId: bigint, contentTitle: string, orderId: bigint, orderCreatedBy: bigint): Promise<void> {
    await this.create({
      user_id: orderCreatedBy,
      type: 'content_uploaded',
      title: 'تم رفع محتوى جديد',
      message: 'المحتوى: ' + contentTitle,
      entity_type: 'content',
      entity_id: contentId,
    });
  }

  /**
   * إشعار عند اكتمال أوردر
   */
  static async notifyOrderCompleted(orderId: bigint, orderTitle: string, createdBy: bigint): Promise<void> {
    await this.create({
      user_id: createdBy,
      type: 'order_completed',
      title: 'تم اكتمال الأوردر',
      message: 'الأوردر: ' + orderTitle,
      entity_type: 'order',
      entity_id: orderId,
    });
  }

  /**
   * إشعار عند اقتراب الموعد النهائي (أقل من 24 ساعة)
   */
  static async notifyDeadlineApproaching(taskId: bigint, taskTitle: string, assignedTo: bigint, deadline: Date): Promise<void> {
    await this.create({
      user_id: assignedTo,
      type: 'deadline_approaching',
      title: 'اقتراب الموعد النهائي',
      message: 'المهمة: ' + taskTitle + ' — الموعد: ' + deadline.toLocaleDateString('ar'),
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  // ============ جلب الإشعارات ============

  static async getByUser(userId: bigint, limit: number = 20, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getUnreadCount(userId: bigint): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count) || 0;
  }

  // ============ تعليم كمقروء ============

  static async markAsRead(id: bigint): Promise<void> {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
  }

  static async markAllAsRead(userId: bigint): Promise<number> {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return result.rowCount || 0;
  }

  // ============ فحص المواعيد القريبة ============

  static async checkDeadlines(): Promise<number> {
    let count = 0;
    const result = await pool.query(
      "SELECT t.id, t.title, t.assigned_to, t.deadline " +
      "FROM tasks t " +
      "LEFT JOIN task_statuses ts ON t.status_id = ts.id " +
      "WHERE t.deadline IS NOT NULL " +
      "AND t.deadline BETWEEN NOW() AND NOW() + INTERVAL '24 hours' " +
      "AND ts.name NOT IN ('Done', 'Cancelled') " +
      "AND t.assigned_to IS NOT NULL " +
      "AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.entity_type = 'task' AND n.entity_id = t.id AND n.type = 'deadline_approaching' AND n.created_at > NOW() - INTERVAL '24 hours')"
    );

    for (const task of result.rows) {
      await this.notifyDeadlineApproaching(task.id, task.title, task.assigned_to, task.deadline);
      count++;
    }
    return count;
  }
}
