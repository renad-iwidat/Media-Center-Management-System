import { Task } from '../../../types/management';
import { TaskCategory } from '../../../config/status-mappings';

export class TaskValidator {
  /**
   * انتقالات حالة المهمة المسموحة — بالفئة المنطقية (category) وليس بالاسم/الـ id.
   * المسار الطبيعي: unassigned → assigned → in_progress → review → done
   * مع السماح بالرجوع للتعديل والرفض في أي وقت.
   */
  private static readonly validTransitions: Record<TaskCategory, TaskCategory[]> = {
    unassigned: ['assigned', 'in_progress', 'rejected'],
    assigned: ['in_progress', 'unassigned', 'rejected'],
    in_progress: ['review', 'needs_edit', 'assigned', 'done', 'rejected'],
    review: ['done', 'needs_edit', 'in_progress', 'rejected'],
    needs_edit: ['in_progress', 'review', 'rejected'],
    done: ['review', 'in_progress'], // إعادة فتح مهمة منجزة عند الحاجة
    rejected: ['unassigned', 'assigned', 'in_progress'], // إعادة تفعيل مهمة مرفوضة
    unknown: [],
  };

  /**
   * التحقق من صحّة انتقال الحالة بالفئة المنطقية.
   * تُستدعى من TaskService بعد تحويل الـ id إلى category عبر StatusRegistry.
   */
  static isValidCategoryTransition(current: TaskCategory, next: TaskCategory): boolean {
    if (current === next) return false;
    if (current === 'unknown' || next === 'unknown') return true; // لا نمنع عند غياب التصنيف
    return this.validTransitions[current]?.includes(next) ?? false;
  }

  static getCategoryTransitionError(current: TaskCategory, next: TaskCategory): string {
    const allowed = this.validTransitions[current] || [];
    return `انتقال غير مسموح من "${current}" إلى "${next}". المسموح: ${allowed.join(', ') || 'لا شيء'}`;
  }

  /**
   * @deprecated يقارن قيماً نصية مباشرة. استُبدل بـ isValidCategoryTransition.
   * أُبقي للتوافق فقط: يمنع فقط الانتقال لنفس القيمة.
   */
  static isValidStatusTransition(currentStatus: any, newStatus: any): boolean {
    const current = currentStatus?.toString() || '';
    const next = newStatus?.toString() || '';
    return current !== next;
  }

  /**
   * Get transition error message (legacy)
   */
  static getTransitionError(currentStatus: any, newStatus: any): string {
    const current = currentStatus?.toString() || '';
    const next = newStatus?.toString() || '';
    return `Invalid transition from ${current} to ${next}`;
  }

  /**
   * Validate Task Data on Creation/Update
   */
  static validateTaskData(data: any, isUpdate: boolean = false): string[] {
    const errors: string[] = [];

    // Only required on create
    if (!isUpdate) {
      if (!data.title || data.title.trim().length < 3) {
        errors.push('Title is required and must be at least 3 characters');
      }
      if (!data.order_id) errors.push('Order is required');
      if (!data.assigned_to) errors.push('Assigned To is required');
      if (!data.status_id) errors.push('Status is required');
      if (!data.priority_id) errors.push('Priority is required');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
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
