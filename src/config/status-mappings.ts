/**
 * Status registry — single source of truth for Order & Task statuses.
 *
 * قاعدة البيانات تخزن أسماء الحالات بالعربية فقط، لكن الكود تاريخياً كان
 * يقارن بأسماء إنجليزية. هذا الملف يوحّد التعامل مع الحالات بحيث:
 *  - يصنّف أي اسم حالة (عربي أو إنجليزي) إلى فئة منطقية ثابتة (category).
 *  - يوفّر دوال مساعدة موحّدة (منجز/قيد تنفيذ/ملغي...) تعمل بالاسم.
 *  - يوفّر StatusRegistry لربط id ↔ name ↔ category مع كاش (للعمل بالـ id الرقمي).
 *
 * أي منطق متعلق بالحالات في النظام يجب أن يمرّ عبر هذا الملف.
 */

import pool from './database';

// ============ الأسماء العربية كما هي في قاعدة البيانات ============

// Order Statuses (order_statuses)
export const ORDER_STATUS = {
  DRAFT: 'مسودة',                     // id: 1
  PENDING_REVIEW: 'بانتظار المراجعة', // id: 2
  IN_PROGRESS: 'قيد التنفيذ',         // id: 3
  ON_HOLD: 'معلق',                    // id: 4
  COMPLETED: 'مكتمل',                 // id: 5
  CANCELLED: 'ملغي',                  // id: 6
};

// Task Statuses (task_statuses)
export const TASK_STATUS = {
  UNASSIGNED: 'غير مُسند',    // id: 1
  ASSIGNED: 'تم الإسناد',     // id: 2
  IN_PROGRESS: 'قيد التنفيذ', // id: 3
  REVIEW: 'مراجعة',           // id: 4
  NEEDS_EDIT: 'يحتاج تعديل',  // id: 5
  DONE: 'منجز',               // id: 6
  REJECTED: 'مرفوض',          // id: 7
};

// ============ الفئات المنطقية ============

export type TaskCategory =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'needs_edit'
  | 'done'
  | 'rejected'
  | 'unknown';

export type OrderCategory =
  | 'draft'
  | 'pending_review'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'unknown';

/**
 * مجموعات أسماء (عربي + إنجليزي) لكل فئة — تُستخدم في التصنيف وفي استعلامات SQL.
 * نُبقي المرادفات الإنجليزية لضمان التوافق مع أي بيانات/بيئات قديمة.
 */
export const TASK_STATUS_NAMES: Record<Exclude<TaskCategory, 'unknown'>, string[]> = {
  unassigned: ['غير مُسند', 'غير مسند', 'Unassigned', 'Pending', 'Created'],
  assigned: ['تم الإسناد', 'Assigned'],
  in_progress: ['قيد التنفيذ', 'In Progress', 'InProgress'],
  review: ['مراجعة', 'Review'],
  needs_edit: ['يحتاج تعديل', 'Needs Edit', 'Rework'],
  done: ['منجز', 'مكتمل', 'Done', 'Completed'],
  rejected: ['مرفوض', 'ملغي', 'Rejected', 'Cancelled'],
};

export const ORDER_STATUS_NAMES: Record<Exclude<OrderCategory, 'unknown'>, string[]> = {
  draft: ['مسودة', 'Draft', 'Created'],
  pending_review: ['بانتظار المراجعة', 'Pending Review', 'Pending', 'Review'],
  in_progress: ['قيد التنفيذ', 'In Progress', 'InProgress'],
  on_hold: ['معلق', 'On Hold', 'Hold'],
  completed: ['مكتمل', 'منجز', 'Completed', 'Done'],
  cancelled: ['ملغي', 'مرفوض', 'Cancelled', 'Rejected'],
};

/** نسبة التقدّم لكل فئة مهمة */
export const TASK_PROGRESS: Record<TaskCategory, number> = {
  unassigned: 0,
  assigned: 10,
  in_progress: 50,
  review: 75,
  needs_edit: 60,
  done: 100,
  rejected: 0,
  unknown: 0,
};

// ============ التصنيف بالاسم (نقي، بدون قاعدة بيانات) ============

function matches(name: string, names: string[]): boolean {
  const n = name.trim().toLowerCase();
  return names.some(c => c.trim().toLowerCase() === n);
}

/** صنّف اسم حالة مهمة إلى فئة منطقية */
export function classifyTaskStatus(name: string | undefined | null): TaskCategory {
  if (!name) return 'unknown';
  // ترتيب الفحص مهم: الأكثر تحديداً أولاً
  const order: Exclude<TaskCategory, 'unknown'>[] = [
    'done', 'rejected', 'needs_edit', 'review', 'in_progress', 'assigned', 'unassigned',
  ];
  for (const cat of order) {
    if (matches(name, TASK_STATUS_NAMES[cat])) return cat;
  }
  return 'unknown';
}

/** صنّف اسم حالة طلب إلى فئة منطقية */
export function classifyOrderStatus(name: string | undefined | null): OrderCategory {
  if (!name) return 'unknown';
  const order: Exclude<OrderCategory, 'unknown'>[] = [
    'cancelled', 'completed', 'on_hold', 'in_progress', 'pending_review', 'draft',
  ];
  for (const cat of order) {
    if (matches(name, ORDER_STATUS_NAMES[cat])) return cat;
  }
  return 'unknown';
}

// ============ دوال مساعدة موحّدة (بالاسم) ============

export function isTaskDone(name: string | undefined): boolean {
  return classifyTaskStatus(name) === 'done';
}
export function isTaskRejected(name: string | undefined): boolean {
  return classifyTaskStatus(name) === 'rejected';
}
/** المهمة منتهية (لا عمل عليها): منجزة أو مرفوضة */
export function isTaskTerminal(name: string | undefined): boolean {
  const c = classifyTaskStatus(name);
  return c === 'done' || c === 'rejected';
}
/** المهمة قيد العمل فعلياً */
export function isTaskActive(name: string | undefined): boolean {
  const c = classifyTaskStatus(name);
  return c === 'in_progress' || c === 'review' || c === 'needs_edit';
}
/** المهمة لم تبدأ بعد */
export function isTaskNotStarted(name: string | undefined): boolean {
  const c = classifyTaskStatus(name);
  return c === 'unassigned' || c === 'assigned';
}

export function isOrderCompleted(name: string | undefined): boolean {
  return classifyOrderStatus(name) === 'completed';
}
export function isOrderCancelled(name: string | undefined): boolean {
  return classifyOrderStatus(name) === 'cancelled';
}
export function isOrderInProgress(name: string | undefined): boolean {
  return classifyOrderStatus(name) === 'in_progress';
}

/** قائمة كل الأسماء (عربي+إنجليزي) لفئات متعددة — مفيدة لبناء استعلامات SQL IN(...) */
export function taskNamesFor(...cats: Exclude<TaskCategory, 'unknown'>[]): string[] {
  return cats.flatMap(c => TASK_STATUS_NAMES[c]);
}
export function orderNamesFor(...cats: Exclude<OrderCategory, 'unknown'>[]): string[] {
  return cats.flatMap(c => ORDER_STATUS_NAMES[c]);
}

/** يبني جزء SQL على شكل ('a','b',...) من قائمة أسماء (مع هروب بسيط للاقتباس) */
export function toSqlInList(names: string[]): string {
  return '(' + names.map(n => `'${n.replace(/'/g, "''")}'`).join(', ') + ')';
}

// قوائم جاهزة للاستخدام في SQL
export const SQL = {
  taskDone: toSqlInList(taskNamesFor('done')),
  taskTerminal: toSqlInList(taskNamesFor('done', 'rejected')),
  taskInProgress: toSqlInList(taskNamesFor('in_progress')),
  taskNotStarted: toSqlInList(taskNamesFor('unassigned', 'assigned')),
  orderCompleted: toSqlInList(orderNamesFor('completed')),
  orderInProgress: toSqlInList(orderNamesFor('in_progress')),
  orderPending: toSqlInList(orderNamesFor('draft', 'pending_review', 'on_hold')),
};

// ============ Legacy helpers (للتوافق) ============

export function isStatusMatch(dbName: string | undefined, ...names: string[]): boolean {
  if (!dbName) return false;
  return names.includes(dbName);
}
export function isDone(statusName: string | undefined): boolean {
  return isTaskDone(statusName) || isOrderCompleted(statusName);
}
export function isInProgress(statusName: string | undefined): boolean {
  return classifyTaskStatus(statusName) === 'in_progress' || classifyOrderStatus(statusName) === 'in_progress';
}
export function isCancelled(statusName: string | undefined): boolean {
  return isTaskRejected(statusName) || isOrderCancelled(statusName);
}
export function isPending(statusName: string | undefined): boolean {
  return isTaskNotStarted(statusName) ||
    ['draft', 'pending_review'].includes(classifyOrderStatus(statusName));
}

// ============ StatusRegistry — ربط id ↔ name ↔ category مع كاش ============

interface StatusRow { id: string; name: string; }

class StatusRegistryImpl {
  private taskById = new Map<string, StatusRow>();
  private orderById = new Map<string, StatusRow>();
  private taskByCategory = new Map<TaskCategory, StatusRow>();
  private orderByCategory = new Map<OrderCategory, StatusRow>();
  private loaded = false;

  /** تحميل الحالات من قاعدة البيانات وبناء الكاش */
  async init(force = false): Promise<void> {
    if (this.loaded && !force) return;
    this.taskById.clear();
    this.orderById.clear();
    this.taskByCategory.clear();
    this.orderByCategory.clear();

    const [ts, os] = await Promise.all([
      pool.query('SELECT id, name FROM task_statuses'),
      pool.query('SELECT id, name FROM order_statuses'),
    ]);

    for (const row of ts.rows) {
      const r: StatusRow = { id: String(row.id), name: row.name };
      this.taskById.set(r.id, r);
      const cat = classifyTaskStatus(r.name);
      if (cat !== 'unknown' && !this.taskByCategory.has(cat)) this.taskByCategory.set(cat, r);
    }
    for (const row of os.rows) {
      const r: StatusRow = { id: String(row.id), name: row.name };
      this.orderById.set(r.id, r);
      const cat = classifyOrderStatus(r.name);
      if (cat !== 'unknown' && !this.orderByCategory.has(cat)) this.orderByCategory.set(cat, r);
    }
    this.loaded = true;
  }

  private async ensure(): Promise<void> {
    if (!this.loaded) await this.init();
  }

  // ----- Task -----
  async taskCategoryById(id: bigint | string | undefined | null): Promise<TaskCategory> {
    if (id === undefined || id === null) return 'unknown';
    await this.ensure();
    const row = this.taskById.get(String(id));
    return row ? classifyTaskStatus(row.name) : 'unknown';
  }
  async taskNameById(id: bigint | string | undefined | null): Promise<string | undefined> {
    if (id === undefined || id === null) return undefined;
    await this.ensure();
    return this.taskById.get(String(id))?.name;
  }
  async taskIdOf(category: TaskCategory): Promise<bigint | undefined> {
    await this.ensure();
    const row = this.taskByCategory.get(category);
    return row ? BigInt(row.id) : undefined;
  }

  // ----- Order -----
  async orderCategoryById(id: bigint | string | undefined | null): Promise<OrderCategory> {
    if (id === undefined || id === null) return 'unknown';
    await this.ensure();
    const row = this.orderById.get(String(id));
    return row ? classifyOrderStatus(row.name) : 'unknown';
  }
  async orderNameById(id: bigint | string | undefined | null): Promise<string | undefined> {
    if (id === undefined || id === null) return undefined;
    await this.ensure();
    return this.orderById.get(String(id))?.name;
  }
  async orderIdOf(category: OrderCategory): Promise<bigint | undefined> {
    await this.ensure();
    const row = this.orderByCategory.get(category);
    return row ? BigInt(row.id) : undefined;
  }

  clear(): void {
    this.loaded = false;
    this.taskById.clear();
    this.orderById.clear();
    this.taskByCategory.clear();
    this.orderByCategory.clear();
  }
}

export const StatusRegistry = new StatusRegistryImpl();
