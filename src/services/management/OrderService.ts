import { OrderModel } from '../../models/management/Order';
import { TaskModel } from '../../models/management/Task';
import { EpisodeModel } from '../../models/content/Episode';
import { ProgramModel } from '../../models/content/Program';
import { Order, OrderStatus, OrderHistory } from '../../types/management';
import { OrderValidator } from './validators/OrderValidator';
import { OrderStatusHelper } from './helpers/OrderStatusHelper';
import pool from '../../config/database';

export class OrderService {
  // ============ CRUD Operations ============

  async createOrder(data: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    this.validateOrderData(data);

    // Auto-create episode if program_id is provided but episode_id is not
    if (data.program_id && !data.episode_id) {
      const program = await ProgramModel.findById(data.program_id);
      if (!program) {
        throw new Error(`Program not found: ${data.program_id}`);
      }

      const lastNumber = await EpisodeModel.getLastEpisodeNumber(data.program_id);
      const newEpisodeNumber = lastNumber + 1;

      const episode = await EpisodeModel.create({
        program_id: data.program_id,
        title: `${program.title} - حلقة ${newEpisodeNumber}`,
        episode_number: newEpisodeNumber,
        air_date: data.deadline,
      });

      data.episode_id = episode.id;
    }

    return await OrderModel.create(data);
  }

  async getOrder(id: bigint): Promise<Order> {
    const order = await OrderModel.findById(id);
    if (!order) {
      throw new Error(`Order not found: ${id}`);
    }
    return order;
  }

  async getAllOrders(limit: number = 10, offset: number = 0): Promise<Order[]> {
    return await OrderModel.findAllWithDetails(limit, offset);
  }

  async searchOrders(
    limit: number = 10,
    offset: number = 0,
    search: string = '',
    desk_id?: bigint,
    status_id?: bigint,
    program_id?: bigint,
    user_id?: bigint
  ): Promise<Order[]> {
    return await OrderModel.searchWithDetails(limit, offset, search, desk_id, status_id, program_id, user_id);
  }

  async countOrders(
    search: string = '',
    desk_id?: bigint,
    status_id?: bigint,
    program_id?: bigint,
    user_id?: bigint
  ): Promise<number> {
    return await OrderModel.countOrders(search, desk_id, status_id, program_id, user_id);
  }

  async updateOrder(id: bigint, updates: Partial<Order>): Promise<Order> {
    await this.getOrder(id); // Verify exists
    this.validateOrderData(updates);
    
    const updated = await OrderModel.update(id, updates);
    if (!updated) {
      throw new Error(`Failed to update order: ${id}`);
    }
    return updated;
  }

  async deleteOrder(id: bigint): Promise<boolean> {
    const canDelete = await this.canDeleteOrder(id);
    if (!canDelete.canDelete) {
      throw new Error(`Cannot delete order: ${canDelete.reason}`);
    }
    return await OrderModel.delete(id);
  }

  // ============ Status Management ============

  async changeOrderStatus(
    orderId: bigint,
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<Order> {
    const order = await this.getOrder(orderId);

    // التحقق من صحّة الانتقال (سياسة الطلبات: أي انتقال مسموح عدا نفس الحالة)
    if (!OrderValidator.isValidStatusTransition(order.status_id, newStatusId)) {
      throw new Error(OrderValidator.getTransitionError(order.status_id, newStatusId));
    }

    // تفويض التنفيذ لخدمة الأتمتة لمسار واحد متّسق:
    // ضبط started_at/completed_at + المدة + التأخير + تسجيل التاريخ + KPI + الأرشفة التلقائية.
    const { OrderAutomationService } = await import('./OrderAutomationService');
    return await OrderAutomationService.handleOrderStatusChange(orderId, newStatusId, changedBy);
  }

  async cancelOrder(
    orderId: bigint,
    cancelledBy: bigint,
    reason?: string
  ): Promise<Order> {
    const order = await this.getOrder(orderId);

    const { StatusRegistry } = await import('../../config/status-mappings');

    // معرّف حالة "ملغي" من السجل المركزي
    const cancelledStatusId = await StatusRegistry.orderIdOf('cancelled');
    if (!cancelledStatusId) {
      throw new Error('حالة "ملغي" غير معرّفة في قاعدة البيانات');
    }

    // الحالات التي يُسمح فيها بالإلغاء (غير المكتملة وغير الملغاة مسبقاً)
    const currentCategory = await StatusRegistry.orderCategoryById(order.status_id);
    const cancelable: typeof currentCategory[] = ['draft', 'pending_review', 'in_progress', 'on_hold'];
    if (!cancelable.includes(currentCategory)) {
      const statusName = await StatusRegistry.orderNameById(order.status_id);
      throw new Error(`لا يمكن إلغاء طلب بحالة: ${statusName || currentCategory}`);
    }

    // Update order status
    const updated = await OrderModel.update(orderId, {
      status_id: cancelledStatusId,
    });

    if (!updated) {
      throw new Error(`Failed to cancel order: ${orderId}`);
    }

    // Record in history
    await OrderModel.addHistory({
      order_id: orderId,
      changed_by: cancelledBy,
      old_status_id: order.status_id,
      new_status_id: cancelledStatusId,
    });

    return updated;
  }

  async getOrderStatuses(): Promise<OrderStatus[]> {
    return await OrderModel.getStatuses();
  }

  async getOrderHistory(orderId: bigint): Promise<OrderHistory[]> {
    return await OrderModel.getHistory(orderId);
  }

  // ============ Filtering & Search ============

  async getOrdersByDesk(deskId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    return await OrderModel.findByDesk(deskId, limit, offset);
  }

  async getOrdersByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    return await OrderModel.findByStatus(statusId, limit, offset);
  }

  async getOrdersByProgram(programId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    return await OrderModel.findByProgram(programId, limit, offset);
  }

  // ============ Business Logic ============

  async canCloseOrder(orderId: bigint): Promise<{ canClose: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);

    const { StatusRegistry, isTaskTerminal } = await import('../../config/status-mappings');

    // فحص: هل في مهام لسا ما خلصت (غير منجزة وغير مرفوضة)
    let pendingCount = 0;
    for (const t of tasks) {
      const name = await StatusRegistry.taskNameById(t.status_id);
      if (!isTaskTerminal(name)) pendingCount++;
    }
    if (pendingCount > 0) {
      reasons.push('في ' + pendingCount + ' مهمة لسا ما خلصت');
    }

    // فحص: هل في محتوى واحد على الأقل
    const pool = (await import('../../config/database')).default;
    const contentResult = await pool.query(
      'SELECT COUNT(*) as count FROM content WHERE task_id IN (SELECT id FROM tasks WHERE order_id = $1)',
      [orderId]
    );
    if (parseInt(contentResult.rows[0].count) === 0) {
      reasons.push('ما في أي محتوى مرتبط بالأوردر');
    }

    return { canClose: reasons.length === 0, reasons };
  }
  async calculateOrderProgress(orderId: bigint): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  }> {
    // نستخدم استعلاماً واحداً مع أسماء الحالات لتصنيف دقيق
    const result = await pool.query(
      `SELECT ts.name as status_name
       FROM tasks t
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       WHERE t.order_id = $1`,
      [orderId]
    );

    const rows = result.rows;
    if (rows.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 };
    }

    const { classifyTaskStatus } = await import('../../config/status-mappings');

    let completed = 0, inProgress = 0, pending = 0;
    for (const r of rows) {
      const cat = classifyTaskStatus(r.status_name);
      if (cat === 'done') completed++;
      else if (cat === 'in_progress' || cat === 'review' || cat === 'needs_edit') inProgress++;
      else if (cat === 'unassigned' || cat === 'assigned') pending++;
      // 'rejected' لا يُحتسب ضمن أي من الفئات الثلاث (لا منجز ولا قيد عمل)
    }

    // النسبة محسوبة على المهام غير المرفوضة (الفعّالة)
    const effectiveTotal = rows.filter(r => classifyTaskStatus(r.status_name) !== 'rejected').length;

    return {
      total: rows.length,
      completed,
      inProgress,
      pending,
      percentage: effectiveTotal > 0 ? Math.round((completed / effectiveTotal) * 100) : 0,
    };
  }

  async validateOrderDeadline(orderId: bigint): Promise<{
    isValid: boolean;
    violations: any[];
  }> {
    const order = await this.getOrder(orderId);
    if (!order.deadline) {
      return { isValid: true, violations: [] };
    }

    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);
    const violations = tasks.filter(
      t => t.deadline && new Date(t.deadline) > new Date(order.deadline!)
    );

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  async canDeleteOrder(orderId: bigint): Promise<{
    canDelete: boolean;
    reason?: string;
  }> {
    const order = await this.getOrder(orderId);

    // تحقق من وجود status_id
    if (!order.status_id) {
      return {
        canDelete: false,
        reason: 'Order status is undefined',
      };
    }

    // منع الحذف للطلبات في حالات حرجة (قيد التنفيذ / مكتمل)
    const { StatusRegistry } = await import('../../config/status-mappings');
    const category = await StatusRegistry.orderCategoryById(order.status_id);
    const nonDeletable: typeof category[] = ['in_progress', 'completed'];

    if (nonDeletable.includes(category)) {
      const statusName = await StatusRegistry.orderNameById(order.status_id);
      return {
        canDelete: false,
        reason: `لا يمكن حذف طلب بحالة: ${statusName || category}`,
      };
    }

    // يُسمح بالحذف في حالات المسودة/الانتظار/التعليق/الملغي
    return { canDelete: true };
  }

  async getOrderWithDetails(orderId: bigint): Promise<any> {
    const order = await OrderModel.findByIdWithDetails(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    const tasks = await TaskModel.findByOrderWithDetails(orderId, 1000, 0);
    const progress = await this.calculateOrderProgress(orderId);
    const history = await this.getOrderHistory(orderId);

    return {
      ...order,
      tasks,
      progress,
      history,
    };
  }

  /**
   * Auto-update Order Status based on Task statuses
   * 
   * Logic:
   * - If any task is In Progress → Order = In Progress
   * - If all tasks are Done → Order = Done
   * - If all tasks are Pending → Order = Pending
   */
  async updateOrderStatusBasedOnTasks(
    orderId: bigint,
    changedBy: bigint
  ): Promise<Order | null> {
    const order = await this.getOrder(orderId);
    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);

    // Calculate appropriate status
    const statusInfo = await OrderStatusHelper.calculateOrderStatus(tasks);
    const shouldUpdateInfo = await OrderStatusHelper.shouldUpdateOrderStatus(order.status_id, tasks);

    if (!shouldUpdateInfo.shouldUpdate) {
      return order;
    }

    // Use the calculated status ID
    const newStatusId = statusInfo.statusId;

    // Update order status
    const updated = await OrderModel.update(orderId, { status_id: newStatusId });
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }

    // Record in history
    await OrderModel.addHistory({
      order_id: orderId,
      changed_by: changedBy,
      old_status_id: order.status_id,
      new_status_id: newStatusId,
    });

    return updated;
  }

  // ============ Private Validation Methods ============

  private validateOrderData(data: any): void {
    const errors = OrderValidator.validateOrderData(data);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  private isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    return OrderValidator.isValidStatusTransition(currentStatus, newStatus);
  }
}