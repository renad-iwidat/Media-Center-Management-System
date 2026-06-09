import { Task } from '../../../types/management';
import { OrderModel } from '../../../models/management/Order';
import { StatusRegistry } from '../../../config/status-mappings';

/**
 * OrderStatusHelper - طلب (Order)
 * Handles status calculations and transitions for Order
 */
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

  /**
   * يحسب حالة الطلب المناسبة بناءً على فئات مهامه:
   *  - لا مهام            → مسودة (draft)
   *  - كل المهام منجزة     → مكتمل (completed)
   *  - كل المهام لم تبدأ   → مسودة (draft)
   *  - غير ذلك            → قيد التنفيذ (in_progress)
   * تتجاهل المهام المرفوضة عند تقرير الاكتمال.
   */
  static async calculateOrderStatus(
    tasks: Task[]
  ): Promise<{ statusId: bigint; statusName: string; reason: string }> {
    const draftId = (await StatusRegistry.orderIdOf('draft')) ?? (await this.fallbackFirstStatusId());
    const completedId = (await StatusRegistry.orderIdOf('completed')) ?? draftId;
    const inProgressId = (await StatusRegistry.orderIdOf('in_progress')) ?? draftId;

    if (tasks.length === 0) {
      return { statusId: draftId, statusName: 'مسودة', reason: 'No tasks in order' };
    }

    // تصنيف كل مهمة
    const categories = await Promise.all(
      tasks.map(t => StatusRegistry.taskCategoryById(t.status_id))
    );

    // نتجاهل المرفوضة عند حساب الاكتمال
    const effective = categories.filter(c => c !== 'rejected');

    if (effective.length === 0) {
      // كل المهام مرفوضة → نعتبر الطلب قيد التنفيذ (يحتاج تدخّل) بدل اعتباره مكتملاً
      return { statusId: inProgressId, statusName: 'قيد التنفيذ', reason: 'All tasks rejected' };
    }

    const allDone = effective.every(c => c === 'done');
    if (allDone) {
      return { statusId: completedId, statusName: 'مكتمل', reason: 'All tasks completed' };
    }

    const allNotStarted = effective.every(c => c === 'unassigned' || c === 'assigned');
    if (allNotStarted) {
      return { statusId: draftId, statusName: 'مسودة', reason: 'All tasks not started' };
    }

    return { statusId: inProgressId, statusName: 'قيد التنفيذ', reason: 'Tasks in progress / mixed' };
  }

  private static async fallbackFirstStatusId(): Promise<bigint> {
    const statuses = await OrderModel.getStatuses();
    if (statuses.length === 0) throw new Error('No order statuses defined');
    return statuses[0].id;
  }

  static async shouldUpdateOrderStatus(
    currentOrderStatus: any,
    tasks: Task[]
  ): Promise<{ shouldUpdate: boolean; newStatusId?: bigint; newStatusName?: string; reason?: string }> {
    const calculated = await this.calculateOrderStatus(tasks);
    if (String(currentOrderStatus) === String(calculated.statusId)) {
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
