import { Task } from '../../../types/management';
import { OrderModel } from '../../../models/management/Order';

export class OrderStatusHelper {
  private static statusCache: Map<string, bigint> = new Map();
  private static statusNameCache: Map<bigint, string> = new Map();

  static async initializeCache(): Promise<void> {
    const statuses = await OrderModel.getStatuses();
    this.statusCache.clear();
    this.statusNameCache.clear();
    for (const status of statuses) {
      this.statusCache.set(status.name, status.id);
      this.statusNameCache.set(status.id, status.name);
    }
  }

  static async calculateOrderStatus(tasks: Task[]): Promise<{ statusId: bigint; statusName: string; reason: string }> {
    if (tasks.length === 0) {
      const pendingId = await this.getStatusId('Pending', 'مسودة', 'بانتظار المراجعة');
      return { statusId: pendingId, statusName: 'Pending', reason: 'No tasks in order' };
    }

    const taskStatuses = tasks.map(t => t.status_id);
    const uniqueStatuses = new Set(taskStatuses);

    const doneId = await this.getStatusId('Done', 'منجز', 'مكتمل');
    const pendingId = await this.getStatusId('Pending', 'مسودة', 'بانتظار المراجعة', 'غير مُسند', 'تم الإسناد');
    const inProgressId = await this.getStatusId('In Progress', 'قيد التنفيذ');
    const reviewId = await this.getStatusId('Review', 'مراجعة');

    if (uniqueStatuses.size === 1 && uniqueStatuses.has(doneId)) {
      return { statusId: doneId, statusName: 'Done', reason: 'All tasks completed' };
    }
    if (uniqueStatuses.size === 1 && uniqueStatuses.has(pendingId)) {
      return { statusId: pendingId, statusName: 'Pending', reason: 'All tasks pending' };
    }
    if (taskStatuses.includes(inProgressId)) {
      return { statusId: inProgressId, statusName: 'In Progress', reason: 'At least one task in progress' };
    }
    if (taskStatuses.includes(reviewId)) {
      return { statusId: inProgressId, statusName: 'In Progress', reason: 'At least one task in review' };
    }
    return { statusId: inProgressId, statusName: 'In Progress', reason: 'Mixed task statuses' };
  }

  static async shouldUpdateOrderStatus(
    currentOrderStatus: any,
    tasks: Task[]
  ): Promise<{ shouldUpdate: boolean; newStatusId?: bigint; newStatusName?: string; reason?: string }> {
    const calculated = await this.calculateOrderStatus(tasks);
    if (currentOrderStatus === calculated.statusId) {
      return { shouldUpdate: false, reason: 'Order status already matches task statuses' };
    }
    return { shouldUpdate: true, newStatusId: calculated.statusId, newStatusName: calculated.statusName, reason: calculated.reason };
  }

  static async getStatusId(statusName: string, ...altNames: string[]): Promise<bigint> {
    const allNames = [statusName, ...altNames];
    for (const n of allNames) {
      if (this.statusCache.has(n)) return this.statusCache.get(n)!;
    }
    const statuses = await OrderModel.getStatuses();
    const status = statuses.find(s => allNames.includes(s.name));
    if (!status) {
      if (statuses.length > 0) return statuses[0].id;
      throw new Error('Status not found: ' + statusName);
    }
    this.statusCache.set(status.name, status.id);
    this.statusNameCache.set(status.id, status.name);
    return status.id;
  }

  static async getStatusName(statusId: bigint): Promise<string> {
    if (this.statusNameCache.has(statusId)) {
      return this.statusNameCache.get(statusId)!;
    }
    const statuses = await OrderModel.getStatuses();
    const status = statuses.find(s => s.id === statusId);
    if (!status) {
      throw new Error('Status not found for id: ' + statusId);
    }
    this.statusNameCache.set(statusId, status.name);
    this.statusCache.set(status.name, statusId);
    return status.name;
  }

  static clearCache(): void {
    this.statusCache.clear();
    this.statusNameCache.clear();
  }
}
