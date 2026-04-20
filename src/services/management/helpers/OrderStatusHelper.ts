import { Task } from '../../../types/management';
import { OrderModel } from '../../../models/management/Order';

/**
 * Helper class to manage Order Status based on Task statuses
 * 
 * Logic:
 * - If any task is In Progress → Order = In Progress
 * - If all tasks are Done → Order = Done
 * - If all tasks are Pending → Order = Pending
 * - If mixed (some Done, some Pending) → Order = In Progress
 * 
 * All status names and IDs are fetched from database (Dynamic)
 */
export class OrderStatusHelper {
  private static statusCache: Map<string, bigint> = new Map();
  private static statusNameCache: Map<bigint, string> = new Map();

  /**
   * Initialize status cache from database
   */
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
   * Calculate the appropriate Order Status based on Task statuses
   */
  static async calculateOrderStatus(tasks: Task[]): Promise<{
    statusId: bigint;
    statusName: string;
    reason: string;
  }> {
    if (tasks.length === 0) {
      const pendingId = await this.getStatusId('Pending');
      return {
        statusId: pendingId,
        statusName: 'Pending',
        reason: 'No tasks in order',
      };
    }

    const taskStatuses = tasks.map(t => t.status_id);
    const uniqueStatuses = new Set(taskStatuses);

    // Get status names from database
    const doneId = await this.getStatusId('Done');
    const pendingId = await this.getStatusId('Pending');
    const inProgressId = await this.getStatusId('In Progress');
    const reviewId = await this.getStatusId('Review');

    // If all tasks are Done
    if (uniqueStatuses.size === 1 && uniqueStatuses.has(doneId)) {
      return {
        statusId: doneId,
        statusName: 'Done',
        reason: 'All tasks completed',
      };
    }

    // If all tasks are Pending
    if (uniqueStatuses.size === 1 && uniqueStatuses.has(pendingId)) {
      return {
        statusId: pendingId,
        statusName: 'Pending',
        reason: 'All tasks pending',
      };
    }

    // If any task is In Progress
    if (taskStatuses.includes(inProgressId)) {
      return {
        statusId: inProgressId,
        statusName: 'In Progress',
        reason: 'At least one task in progress',
      };
    }

    // If any task is Review
    if (taskStatuses.includes(reviewId)) {
      return {
        statusId: inProgressId,
        statusName: 'In Progress',
        reason: 'At least one task in review',
      };
    }

    // Mixed statuses (some Done, some Pending)
    return {
      statusId: inProgressId,
      statusName: 'In Progress',
      reason: 'Mixed task statuses',
    };
  }

  /**
   * Check if Order Status should be updated based on Task statuses
   */
  static async shouldUpdateOrderStatus(
    currentOrderStatus: any,
    tasks: Task[]
  ): Promise<{ shouldUpdate: boolean; newStatusId?: bigint; newStatusName?: string; reason?: string }> {
    const calculated = await this.calculateOrderStatus(tasks);
    const current = currentOrderStatus;

    if (current === calculated.statusId) {
      return {
        shouldUpdate: false,
        reason: 'Order status already matches task statuses',
      };
    }

    return {
      shouldUpdate: true,
      newStatusId: calculated.statusId,
      newStatusName: calculated.statusName,
      reason: calculated.reason,
    };
  }

  /**
   * Get Order Status ID from status name (Dynamic from DB)
   */
  static async getStatusId(statusName: string): Promise<bigint> {
    // Check cache first
    if (this.statusCache.has(statusName)) {
      return this.statusCache.get(statusName)!;
    }

    // Fetch from database if not in cache
    const statuses = await OrderModel.getStatuses();
    const status = statuses.find(s => s.name === statusName);

    if (!status) {
      throw new Error(`Order status not found: ${statusName}`);
    }

    // Cache it
    this.statusCache.set(statusName, status.id);
    this.statusNameCache.set(status.id, statusName);

    return status.id;
  }

  /**
   * Get status name from ID (Dynamic from DB)
   */
  static async getStatusName(statusId: bigint): Promise<string> {
    // Check cache first
    if (this.statusNameCache.has(statusId)) {
      return this.statusNameCache.get(statusId)!;
    }

    // Fetch from database if not in cache
    const statuses = await OrderModel.getStatuses();
    const status = statuses.find(s => s.id === statusId);

    if (!status) {
      throw new Error(`Order status not found: ${statusId}`);
    }

    // Cache it
    this.statusNameCache.set(statusId, status.name);
    this.statusCache.set(status.name, statusId);

    return status.name;
  }

  /**
   * Clear cache (useful for testing or when statuses change)
   */
  static clearCache(): void {
    this.statusCache.clear();
    this.statusNameCache.clear();
  }
}
