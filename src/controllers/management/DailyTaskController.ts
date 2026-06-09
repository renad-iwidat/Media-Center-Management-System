import { Request, Response } from 'express';
import { DailyTaskService, DailyTaskError } from '../../services/management/DailyTaskService';

/**
 * DailyTaskController — نقاط نهاية المهام اليومية الثابتة.
 * يتبع نفس غلاف الاستجابة { success, data|error, timestamp } المستخدم في المشروع.
 */
export class DailyTaskController {
  // ============ إدارة القوالب ============

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const { title, assigned_to, sequence_order, is_active } = req.body;

      const template = await DailyTaskService.createTemplate(requesterId, {
        title,
        assigned_to: assigned_to !== undefined ? BigInt(assigned_to) : (assigned_to as any),
        sequence_order: sequence_order !== undefined ? Number(sequence_order) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      });

      this.sendSuccess(res, template, 201);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const templateId = BigInt(req.params.id);
      const { title, assigned_to, is_active } = req.body;

      const template = await DailyTaskService.updateTemplate(requesterId, templateId, {
        title,
        assigned_to: assigned_to !== undefined ? BigInt(assigned_to) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      });

      this.sendSuccess(res, template, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async reorderTemplates(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const { assigned_to, ordered_ids } = req.body;

      if (assigned_to === undefined || !Array.isArray(ordered_ids)) {
        this.sendError(res, 'الحقول المطلوبة: assigned_to و ordered_ids[]', 400);
        return;
      }

      const templates = await DailyTaskService.reorderTemplates(
        requesterId,
        BigInt(assigned_to),
        ordered_ids.map((id: any) => BigInt(id))
      );
      this.sendSuccess(res, templates, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const templateId = BigInt(req.params.id);
      await DailyTaskService.deleteTemplate(requesterId, templateId);
      this.sendSuccess(res, { deleted: true }, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const assignedTo = req.query.assigned_to
        ? BigInt(req.query.assigned_to as string)
        : requesterId;
      const templates = await DailyTaskService.getTemplatesForAssignee(requesterId, assignedTo);
      this.sendSuccess(res, templates, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ============ قائمة التحقق والإنجاز ============

  async getChecklist(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const targetUserId = req.query.user_id
        ? BigInt(req.query.user_id as string)
        : requesterId;
      const date = req.query.date ? (req.query.date as string) : undefined;

      const checklist = await DailyTaskService.getChecklistFor(requesterId, targetUserId, date);
      this.sendSuccess(res, checklist, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async completeItem(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const templateId = BigInt(req.params.templateId);
      const date = req.body?.date ? (req.body.date as string) : undefined;

      const item = await DailyTaskService.markComplete(requesterId, templateId, date);
      this.sendSuccess(res, item, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async uncompleteItem(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = BigInt(req.user!.user_id);
      const templateId = BigInt(req.params.templateId);
      const date = req.body?.date ? (req.body.date as string) : undefined;

      const item = await DailyTaskService.markIncomplete(requesterId, templateId, date);
      this.sendSuccess(res, item, 200);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ============ Helpers ============

  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  private sendError(res: Response, message: string, statusCode: number = 400): void {
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof DailyTaskError) {
      this.sendError(res, error.message, error.statusCode);
      return;
    }
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    this.sendError(res, message, 500);
  }
}
