import { Order } from '../../../types/management';

export class OrderValidator {
  /**
   * Valid Order Status Transitions
   * Created → Pending → In Progress → Review → Done
   * Any status can go to Cancelled
   */
  private static readonly validTransitions: Record<string, string[]> = {
    'Created': ['Pending', 'Cancelled'],
    'Pending': ['In Progress', 'Cancelled'],
    'In Progress': ['Review', 'Cancelled'],
    'Review': ['Done', 'In Progress', 'Cancelled'],
    'Done': [],
    'Cancelled': [],
  };

  /**
   * Validate Order Status Transition
   * @param currentStatus Current order status
   * @param newStatus New order status to transition to
   * @returns true if transition is valid
   */
  static isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    const current = currentStatus?.toString() || '';
    const next = newStatus?.toString() || '';

    return this.validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * Get transition error message
   */
  static getTransitionError(currentStatus: any, newStatus: any): string {
    const current = currentStatus?.toString() || '';
    const next = newStatus?.toString() || '';
    const allowed = this.validTransitions[current] || [];

    return `Invalid transition from ${current} to ${next}. Allowed: ${allowed.join(', ')}`;
  }

  /**
   * Validate Order Data on Creation/Update
   */
  static validateOrderData(data: any): string[] {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }

    if (!data.desk_id) {
      errors.push('Desk is required');
    }

    if (!data.status_id) {
      errors.push('Status is required');
    }

    if (!data.priority_id) {
      errors.push('Priority is required');
    }

    if (data.deadline && new Date(data.deadline) < new Date()) {
      errors.push('Deadline must be in the future');
    }

    if (data.media_unit_id && !Number.isInteger(Number(data.media_unit_id))) {
      errors.push('Media Unit ID must be a valid number');
    }

    return errors;
  }

  /**
   * Validate Order Deadline against Task Deadlines
   */
  static validateOrderDeadlineAgainstTasks(
    orderDeadline: Date | undefined,
    taskDeadlines: (Date | undefined)[]
  ): { isValid: boolean; violations: Date[] } {
    if (!orderDeadline) {
      return { isValid: true, violations: [] };
    }

    const violations = taskDeadlines.filter(
      td => td && new Date(td) > new Date(orderDeadline)
    );

    return {
      isValid: violations.length === 0,
      violations: violations as Date[],
    };
  }

  /**
   * Validate Order can be deleted
   */
  static canDeleteOrder(
    orderStatus: any,
    activeTaskCount: number,
    activeShootingCount: number
  ): { canDelete: boolean; reason?: string } {
    const status = orderStatus?.toString() || '';
    const nonDeletableStatuses = ['In Progress', 'Review'];

    if (nonDeletableStatuses.includes(status)) {
      return {
        canDelete: false,
        reason: `Cannot delete order with status: ${status}`,
      };
    }

    if (activeTaskCount > 0) {
      return {
        canDelete: false,
        reason: `Order has ${activeTaskCount} active tasks`,
      };
    }

    if (activeShootingCount > 0) {
      return {
        canDelete: false,
        reason: `Order has ${activeShootingCount} active shootings`,
      };
    }

    return { canDelete: true };
  }

  /**
   * Validate Order can be cancelled
   */
  static canCancelOrder(orderStatus: any): { canCancel: boolean; reason?: string } {
    const status = orderStatus?.toString() || '';
    const cancelableStatuses = ['Created', 'Pending', 'In Progress', 'Review'];

    if (!cancelableStatuses.includes(status)) {
      return {
        canCancel: false,
        reason: `Cannot cancel order with status: ${status}`,
      };
    }

    return { canCancel: true };
  }
}
