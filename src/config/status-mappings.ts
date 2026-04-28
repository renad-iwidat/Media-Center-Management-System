/**
 * Status name mappings — Arabic names from database
 * Used to match status names in business logic
 */

// Order Statuses
export const ORDER_STATUS = {
  DRAFT: 'مسودة',           // id: 1
  PENDING_REVIEW: 'بانتظار المراجعة', // id: 2
  IN_PROGRESS: 'قيد التنفيذ',  // id: 3
  ON_HOLD: 'معلق',          // id: 4
  COMPLETED: 'مكتمل',       // id: 5
  CANCELLED: 'ملغي',        // id: 6
};

// Task Statuses
export const TASK_STATUS = {
  UNASSIGNED: 'غير مُسند',    // id: 1
  ASSIGNED: 'تم الإسناد',     // id: 2
  IN_PROGRESS: 'قيد التنفيذ',  // id: 3
  REVIEW: 'مراجعة',          // id: 4
  NEEDS_EDIT: 'يحتاج تعديل',  // id: 5
  DONE: 'منجز',             // id: 6
  REJECTED: 'مرفوض',        // id: 7
};

// Helper: check if a status name matches (supports both Arabic and English)
export function isStatusMatch(dbName: string | undefined, ...names: string[]): boolean {
  if (!dbName) return false;
  return names.includes(dbName);
}

// Common checks
export function isDone(statusName: string | undefined): boolean {
  return isStatusMatch(statusName, 'Done', 'منجز', TASK_STATUS.DONE, ORDER_STATUS.COMPLETED);
}

export function isInProgress(statusName: string | undefined): boolean {
  return isStatusMatch(statusName, 'In Progress', 'قيد التنفيذ', TASK_STATUS.IN_PROGRESS, ORDER_STATUS.IN_PROGRESS);
}

export function isCancelled(statusName: string | undefined): boolean {
  return isStatusMatch(statusName, 'Cancelled', 'ملغي', 'مرفوض', ORDER_STATUS.CANCELLED, TASK_STATUS.REJECTED);
}

export function isPending(statusName: string | undefined): boolean {
  return isStatusMatch(statusName, 'Pending', 'Created', 'مسودة', 'بانتظار المراجعة', 'غير مُسند', 'تم الإسناد',
    ORDER_STATUS.DRAFT, ORDER_STATUS.PENDING_REVIEW, TASK_STATUS.UNASSIGNED, TASK_STATUS.ASSIGNED);
}
