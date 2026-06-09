import pool from '../../config/database';
import { DailyTaskTemplateModel } from '../../models/management/DailyTaskTemplate';
import { DailyTaskCompletionModel } from '../../models/management/DailyTaskCompletion';
import { PermissionService } from './PermissionService';
import { KPIService } from './KPIService';
import { NotificationService } from './NotificationService';
import {
  DailyChecklistItem,
  DailyTaskTemplate,
  CreateDailyTaskTemplateDTO,
  UpdateDailyTaskTemplateDTO,
} from '../../types/management';
import { isFutureBusinessDay } from './helpers/dailyTaskLogic';

/**
 * المنطقة الزمنية المرجعية الثابتة لتحديد حدود اليوم التشغيلي.
 * قابلة للضبط عبر متغيّر البيئة DAILY_TASK_TIMEZONE.
 */
const DAILY_TASK_TIMEZONE = process.env.DAILY_TASK_TIMEZONE || 'Asia/Jerusalem';

/**
 * خطأ خدمة يحمل رمز حالة HTTP ليُترجمه الـ Controller.
 */
export class DailyTaskError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'DailyTaskError';
    this.statusCode = statusCode;
  }
}

const PERM_MANAGE = 'daily_tasks.manage';
const PERM_VIEW_ALL = 'daily_tasks.view_all';

export class DailyTaskService {
  /**
   * تحويل أي طابع زمني (أو undefined = الآن) إلى يوم تشغيلي حتمي YYYY-MM-DD
   * وفق المنطقة الزمنية المرجعية الثابتة.
   */
  static resolveBusinessDay(date?: Date | string): string {
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) {
      throw new DailyTaskError('تاريخ غير صالح', 400);
    }
    // en-CA يُنتج صيغة YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DAILY_TASK_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  // ============ صلاحيات ============

  private static async hasManage(userId: bigint): Promise<boolean> {
    return PermissionService.userHasPermission(userId, PERM_MANAGE);
  }

  private static async hasViewAll(userId: bigint): Promise<boolean> {
    return PermissionService.userHasPermission(userId, PERM_VIEW_ALL);
  }

  private static async requireManage(userId: bigint): Promise<void> {
    if (!(await this.hasManage(userId))) {
      throw new DailyTaskError('صلاحيات غير كافية لإدارة المهام اليومية', 403);
    }
  }

  /**
   * يُسمح بإدارة القوالب إذا كان الطالب هو صاحب القوالب نفسه،
   * أو كان يملك صلاحية إدارة المهام اليومية (مدير) لإدارة قوالب أي موظف.
   */
  private static async requireCanManageFor(requesterId: bigint, targetUserId: bigint): Promise<void> {
    if (requesterId === targetUserId) return;
    if (await this.hasManage(requesterId)) return;
    throw new DailyTaskError('غير مخوّل لإدارة المهام اليومية لموظف آخر', 403);
  }

  private static async userExists(userId: bigint): Promise<boolean> {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
  }

  /**
   * إرسال إشعار للموظف عند تعديل مهامه اليومية من طرف شخص آخر (مدير).
   * لا يُرسل إشعار إذا كان الموظف نفسه هو من قام بالعملية.
   */
  private static async notifyAssignee(
    assigneeId: bigint,
    actorId: bigint,
    title: string,
    message: string
  ): Promise<void> {
    if (assigneeId === actorId) return; // لا إشعار للنفس
    try {
      await NotificationService.create({
        user_id: assigneeId,
        type: 'daily_task',
        title,
        message,
      });
    } catch (err) {
      console.error('فشل إرسال إشعار المهمة اليومية:', err);
    }
  }

  // ============ إدارة القوالب ============

  static async createTemplate(
    requesterId: bigint,
    data: CreateDailyTaskTemplateDTO
  ): Promise<DailyTaskTemplate> {
    if (!data.title || !data.title.trim()) {
      throw new DailyTaskError('الحقل المطلوب ناقص: title', 400);
    }

    // إذا لم يُحدَّد الموظف، يُنشئ الموظف مهمته لنفسه
    const assignedTo =
      data.assigned_to !== undefined && data.assigned_to !== null
        ? BigInt(data.assigned_to)
        : requesterId;

    // الموظف يضيف لنفسه، والمدير يضيف لأي موظف
    await this.requireCanManageFor(requesterId, assignedTo);

    if (!(await this.userExists(assignedTo))) {
      throw new DailyTaskError('الموظف المُسند إليه غير موجود', 400);
    }

    const sequenceOrder =
      data.sequence_order !== undefined
        ? data.sequence_order
        : (await DailyTaskTemplateModel.getMaxSequence(assignedTo)) + 1;

    const isActive = data.is_active !== undefined ? data.is_active : true;

    const created = await DailyTaskTemplateModel.create({
      title: data.title.trim(),
      assigned_to: assignedTo,
      sequence_order: sequenceOrder,
      is_active: isActive,
      created_by: requesterId,
    });

    await this.notifyAssignee(
      assignedTo,
      requesterId,
      'مهمة يومية جديدة',
      `تمت إضافة مهمة يومية جديدة لك: ${created.title}`
    );

    return created;
  }

  static async updateTemplate(
    requesterId: bigint,
    templateId: bigint,
    updates: UpdateDailyTaskTemplateDTO
  ): Promise<DailyTaskTemplate> {
    const existing = await DailyTaskTemplateModel.findById(templateId);
    if (!existing) {
      throw new DailyTaskError('القالب غير موجود', 404);
    }

    // الموظف يعدّل قوالبه، والمدير يعدّل قوالب أي موظف
    await this.requireCanManageFor(requesterId, BigInt(existing.assigned_to));

    if (updates.title !== undefined && !updates.title.trim()) {
      throw new DailyTaskError('عنوان القالب لا يمكن أن يكون فارغاً', 400);
    }

    // إعادة الإسناد لموظف آخر تتطلب صلاحية إدارة (مدير فقط)
    if (updates.assigned_to !== undefined) {
      if (!(await this.hasManage(requesterId))) {
        throw new DailyTaskError('غير مخوّل لإعادة إسناد المهمة لموظف آخر', 403);
      }
      const newAssignee = BigInt(updates.assigned_to);
      if (!(await this.userExists(newAssignee))) {
        throw new DailyTaskError('الموظف المُسند إليه غير موجود', 400);
      }
    }

    const cleaned: Partial<DailyTaskTemplate> = {};
    if (updates.title !== undefined) cleaned.title = updates.title.trim();
    if (updates.assigned_to !== undefined) cleaned.assigned_to = BigInt(updates.assigned_to);
    if (updates.is_active !== undefined) cleaned.is_active = updates.is_active;

    const updated = await DailyTaskTemplateModel.update(templateId, cleaned);
    if (!updated) {
      throw new DailyTaskError('القالب غير موجود', 404);
    }

    // إشعارات حسب نوع التعديل
    const assigneeId = BigInt(existing.assigned_to);
    if (updates.is_active !== undefined && updates.is_active !== existing.is_active) {
      await this.notifyAssignee(
        assigneeId,
        requesterId,
        updates.is_active ? 'تم تفعيل مهمة يومية' : 'تم تعطيل مهمة يومية',
        `${updates.is_active ? 'تم تفعيل' : 'تم تعطيل'} المهمة اليومية: ${updated.title}`
      );
    } else if (updates.title !== undefined) {
      await this.notifyAssignee(
        assigneeId,
        requesterId,
        'تم تعديل مهمة يومية',
        `تم تعديل عنوان مهمتك اليومية إلى: ${updated.title}`
      );
    }

    // إشعار إعادة الإسناد: نُعلم الموظف الجديد
    if (updates.assigned_to !== undefined && BigInt(updates.assigned_to) !== assigneeId) {
      await this.notifyAssignee(
        BigInt(updates.assigned_to),
        requesterId,
        'تم إسناد مهمة يومية لك',
        `تم إسناد مهمة يومية لك: ${updated.title}`
      );
    }

    return updated;
  }

  static async reorderTemplates(
    requesterId: bigint,
    assignedTo: bigint,
    orderedIds: bigint[]
  ): Promise<DailyTaskTemplate[]> {
    await this.requireCanManageFor(requesterId, assignedTo);
    await DailyTaskTemplateModel.reorder(assignedTo, orderedIds);
    return DailyTaskTemplateModel.findByAssignee(assignedTo, { activeOnly: false });
  }

  static async deleteTemplate(requesterId: bigint, templateId: bigint): Promise<boolean> {
    const existing = await DailyTaskTemplateModel.findById(templateId);
    if (!existing) {
      throw new DailyTaskError('القالب غير موجود', 404);
    }
    await this.requireCanManageFor(requesterId, BigInt(existing.assigned_to));
    const deleted = await DailyTaskTemplateModel.softDelete(templateId);
    if (deleted) {
      await this.notifyAssignee(
        BigInt(existing.assigned_to),
        requesterId,
        'تم حذف مهمة يومية',
        `تم حذف المهمة اليومية: ${existing.title}`
      );
    }
    return deleted;
  }

  static async getTemplatesForAssignee(
    requesterId: bigint,
    assignedTo: bigint
  ): Promise<DailyTaskTemplate[]> {
    // المدير يرى قوالب أي موظف؛ الموظف يرى قوالبه فقط.
    if (requesterId !== assignedTo && !(await this.hasManage(requesterId))) {
      throw new DailyTaskError('غير مخوّل لعرض قوالب موظف آخر', 403);
    }
    return DailyTaskTemplateModel.findByAssignee(assignedTo, { activeOnly: false });
  }

  // ============ قائمة التحقق والإنجاز ============

  static async getChecklistFor(
    requesterId: bigint,
    targetUserId: bigint,
    date?: string
  ): Promise<{ business_day: string; user_id: string; items: DailyChecklistItem[] }> {
    if (requesterId !== targetUserId && !(await this.hasViewAll(requesterId))) {
      throw new DailyTaskError('غير مخوّل لعرض قائمة موظف آخر', 403);
    }
    const businessDay = this.resolveBusinessDay(date);
    const items = await DailyTaskCompletionModel.getChecklist(targetUserId, businessDay);
    return { business_day: businessDay, user_id: targetUserId.toString(), items };
  }

  private static async assertOwnership(templateId: bigint, requesterId: bigint): Promise<DailyTaskTemplate> {
    const template = await DailyTaskTemplateModel.findById(templateId);
    if (!template) {
      throw new DailyTaskError('القالب غير موجود', 404);
    }
    if (BigInt(template.assigned_to) !== requesterId) {
      throw new DailyTaskError('غير مخوّل لتعديل هذا العنصر', 403);
    }
    return template;
  }

  private static assertNotFutureDay(businessDay: string): void {
    const today = this.resolveBusinessDay();
    if (isFutureBusinessDay(businessDay, today)) {
      throw new DailyTaskError('لا يُسمح بتسجيل إنجاز ليوم لم يبدأ', 400);
    }
  }

  static async markComplete(
    requesterId: bigint,
    templateId: bigint,
    date?: string
  ): Promise<DailyChecklistItem> {
    await this.assertOwnership(templateId, requesterId);
    const businessDay = this.resolveBusinessDay(date);
    this.assertNotFutureDay(businessDay);

    await DailyTaskCompletionModel.upsertCompletion(templateId, businessDay, true, requesterId);
    await this.safeRecalculateKPI(requesterId);

    return this.buildItem(templateId, businessDay);
  }

  static async markIncomplete(
    requesterId: bigint,
    templateId: bigint,
    date?: string
  ): Promise<DailyChecklistItem> {
    await this.assertOwnership(templateId, requesterId);
    const businessDay = this.resolveBusinessDay(date);
    this.assertNotFutureDay(businessDay);

    await DailyTaskCompletionModel.upsertCompletion(templateId, businessDay, false, requesterId);
    await this.safeRecalculateKPI(requesterId);

    return this.buildItem(templateId, businessDay);
  }

  /**
   * فشل احتساب KPI لا يُفشل عملية وضع العلامة.
   */
  private static async safeRecalculateKPI(userId: bigint): Promise<void> {
    try {
      await KPIService.calculateUserKPI(userId);
    } catch (err) {
      console.error('فشل إعادة احتساب KPI للمهام اليومية:', err);
    }
  }

  private static async buildItem(templateId: bigint, businessDay: string): Promise<DailyChecklistItem> {
    const template = await DailyTaskTemplateModel.findById(templateId);
    const completion = await DailyTaskCompletionModel.findCompletion(templateId, businessDay);
    return {
      template_id: templateId,
      title: template ? template.title : '',
      sequence_order: template ? template.sequence_order : 0,
      is_completed: completion ? completion.is_completed : false,
      marked_at: completion ? completion.marked_at || null : null,
    };
  }
}
