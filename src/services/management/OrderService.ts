import { OrderModel } from '../../models/management/Order';
import { TaskModel } from '../../models/management/Task';
import { Order, OrderStatus, OrderHistory } from '../../types/management';
import { OrderValidator } from './validators/OrderValidator';
import { OrderStatusHelper } from './helpers/OrderStatusHelper';

export class OrderService {
  // ============ CRUD Operations ============

  async createOrder(data: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    this.validateOrderData(data);
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
    return await OrderModel.findAll(limit, offset);
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
    
    // Validate status transition using validator
    if (!OrderValidator.isValidStatusTransition(order.status_id, newStatusId)) {
      throw new Error(OrderValidator.getTransitionError(order.status_id, newStatusId));
    }

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

  async cancelOrder(
    orderId: bigint,
    cancelledBy: bigint,
    reason?: string
  ): Promise<Order> {
    const order = await this.getOrder(orderId);

    // Get cancelled status ID dynamically
    const cancelledStatusId = await OrderStatusHelper.getStatusId('Cancelled');

    // Check if can be cancelled
    const createdId = await OrderStatusHelper.getStatusId('Created');
    const inProgressId = await OrderStatusHelper.getStatusId('In Progress');
    const reviewId = await OrderStatusHelper.getStatusId('Review');

    const cancelableStatusIds = [createdId, inProgressId, reviewId];
    if (!order.status_id || !cancelableStatusIds.includes(order.status_id)) {
      throw new Error(
        `Cannot cancel order with status: ${order.status_id}`
      );
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

  async calculateOrderProgress(orderId: bigint): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  }> {
    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);

    if (tasks.length === 0) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 };
    }

    const completed = tasks.filter(t => t.status_id?.toString() === 'Done').length;
    const inProgress = tasks.filter(t => t.status_id?.toString() === 'In Progress').length;
    const pending = tasks.filter(t => t.status_id?.toString() === 'Pending').length;

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending,
      percentage: Math.round((completed / tasks.length) * 100),
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

    // Check status
    const nonDeletableStatuses = ['In Progress', 'Review'];
    if (nonDeletableStatuses.includes(order.status_id?.toString() || '')) {
      return {
        canDelete: false,
        reason: `Cannot delete order with status: ${order.status_id}`,
      };
    }

    // Check for active tasks
    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);
    const activeTasks = tasks.filter(
      t => !['Done', 'Cancelled'].includes(t.status_id?.toString() || '')
    );

    if (activeTasks.length > 0) {
      return {
        canDelete: false,
        reason: `Order has ${activeTasks.length} active tasks`,
      };
    }

    return { canDelete: true };
  }

  async getOrderWithDetails(orderId: bigint): Promise<any> {
    const order = await this.getOrder(orderId);
    const tasks = await TaskModel.findByOrder(orderId, 1000, 0);
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
