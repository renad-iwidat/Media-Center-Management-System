import { Task } from '../../../types/management';

export class TaskValidator {
  /**
   * Valid Task Status Transitions
   * Pending → In Progress → Review → Done
   * Any status can go to Cancelled or back to Pending
   */
  private static readonly validTransitions: Record<string, string[]> = {
    'Pending': ['In Progress', 'Cancelled'],
    'In Progress': ['Review', 'Pending', 'Cancelled'],
    'Review': ['Done', 'In Progress', 'Cancelled'],
    'Done': [],
    'Cancelled': [],
    'Overdue': ['In Progress', 'Cancelled'],
  };

  /**
   * Validate Task Status Transition
   * @param currentStatus Current task status
   * @param newStatus New task status to transition to
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
   * Validate Task Data on Creation/Update
   */
  static validateTaskData(data: any): string[] {
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

    if (!data.order_id) {
      errors.push('Order is required');
    }

    if (!data.assigned_to) {
      errors.push('Assigned To is required');
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

    return errors;
  }

  /**
   * Validate Task Deadline against Order Deadline
   */
  static validateTaskDeadlineAgainstOrder(
    taskDeadline: Date | undefined,
    orderDeadline: Date | undefined
  ): { isValid: boolean; reason?: string } {
    if (!taskDeadline || !orderDeadline) {
      return { isValid: true };
    }

    if (new Date(taskDeadline) > new Date(orderDeadline)) {
      return {
        isValid: false,
        reason: `Task deadline cannot exceed order deadline: ${orderDeadline}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate Task can be deleted
   */
  static canDeleteTask(
    taskStatus: any,
    hasDependentTasks: boolean
  ): { canDelete: boolean; reason?: string } {
    const status = taskStatus?.toString() || '';
    const nonDeletableStatuses = ['In Progress', 'Review'];

    if (nonDeletableStatuses.includes(status)) {
      return {
        canDelete: false,
        reason: `Cannot delete task with status: ${status}`,
      };
    }

    if (hasDependentTasks) {
      return {
        canDelete: false,
        reason: 'Task has dependent tasks',
      };
    }

    return { canDelete: true };
  }

  /**
   * Validate Task Assignee (check if user is in same desk/team)
   * Optional: Can be enforced based on business rules
   */
  static validateTaskAssignee(
    assigneeDesk: bigint | undefined,
    taskDesk: bigint | undefined,
    allowCrossDeskAssignment: boolean = false
  ): { isValid: boolean; reason?: string } {
    if (allowCrossDeskAssignment) {
      return { isValid: true };
    }

    if (assigneeDesk && taskDesk && assigneeDesk !== taskDesk) {
      return {
        isValid: false,
        reason: 'Task assignee must be from the same desk',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate Task can transition to In Progress
   * (checks dependencies)
   */
  static canTransitionToInProgress(
    blockedByCount: number
  ): { canTransition: boolean; reason?: string } {
    if (blockedByCount > 0) {
      return {
        canTransition: false,
        reason: `Task is blocked by ${blockedByCount} incomplete dependencies`,
      };
    }

    return { canTransition: true };
  }
}
