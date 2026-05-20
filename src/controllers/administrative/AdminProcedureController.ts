import { Request, Response } from 'express';
import { AdminProcedureService } from '../../services/administrative/AdminProcedureService';
import { AdminProcS3Service } from '../../services/administrative/AdminProcS3Service';

/**
 * AdminProcedureController - معالج الـ HTTP requests للنظام الإداري
 * 
 * يتعامل مع:
 * - الأقسام الإدارية (Categories)
 * - الطلبات الإدارية (Orders)
 * - المهام الإدارية (Tasks)
 * - التعليقات والمنشنات (Comments & Mentions)
 * - الملفات المرفقة (Attachments)
 * - الأرشيف الخاص (Archive)
 * - صلاحيات الوصول (Access Control)
 */
export class AdminProcedureController {

  // ============ Access Control ============

  /**
   * GET /api/administrative/access/check
   * فحص إذا المستخدم له صلاحية وصول
   */
  async checkAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const hasAccess = await AdminProcedureService.hasAdminAccess(userId);
      this.sendSuccess(res, { has_access: hasAccess });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/access/users
   * جلب كل المستخدمين اللي عندهم صلاحية وصول
   */
  async getAuthorizedUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await AdminProcedureService.getAuthorizedUsers();
      this.sendSuccess(res, users);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/administrative/access/grant
   * منح صلاحية وصول لمستخدم
   */
  async grantAccess(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.body;
      const grantedBy = BigInt(req.user!.user_id);

      if (!user_id) {
        this.sendError(res, 'user_id مطلوب', 400);
        return;
      }

      // التحقق إن المستخدم الحالي له صلاحية
      const hasAccess = await AdminProcedureService.hasAdminAccess(grantedBy);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لمنح الوصول', 403);
        return;
      }

      const access = await AdminProcedureService.grantAccess(BigInt(user_id), grantedBy);
      this.sendSuccess(res, access, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/administrative/access/:userId
   * سحب صلاحية الوصول
   */
  async revokeAccess(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUser = BigInt(req.user!.user_id);

      // التحقق إن المستخدم الحالي له صلاحية
      const hasAccess = await AdminProcedureService.hasAdminAccess(currentUser);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لسحب الوصول', 403);
        return;
      }

      const result = await AdminProcedureService.revokeAccess(BigInt(userId));
      this.sendSuccess(res, { revoked: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Categories (الأقسام الأربعة) ============

  /**
   * GET /api/administrative/categories
   * جلب الأقسام الإدارية الأربعة
   */
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await AdminProcedureService.getAllCategories();
      this.sendSuccess(res, categories);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/categories/:id
   * جلب قسم معين
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await AdminProcedureService.getCategoryById(BigInt(id));
      
      if (!category) {
        this.sendError(res, 'القسم غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, category);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Orders (الطلبات الإدارية) ============

  /**
   * POST /api/administrative/orders
   * إنشاء طلب إداري جديد
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { 
        category_id, 
        title, 
        description, 
        status_id, 
        priority_id, 
        deadline, 
        notes,
        tender_id,
        donor_client,
        announcement_link,
        submission_deadline,
        initial_notes,
        hr_type,
        leave_type,
        employee_id,
        start_date,
        end_date,
        days_count,
        leave_time_from,
        leave_time_to,
        reason,
        substitute_id,
      } = req.body;

      const created_by = BigInt(req.user!.user_id);

      // التحقق من الصلاحيات
      const hasAccess = await AdminProcedureService.hasAdminAccess(created_by);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لإنشاء طلب إداري', 403);
        return;
      }

      // Validate required fields
      if (!category_id || !title || !status_id) {
        this.sendError(res, 'category_id و title و status_id مطلوبين', 400);
        return;
      }

      const order = await AdminProcedureService.createOrder({
        category_id: BigInt(category_id),
        title,
        description,
        status_id: BigInt(status_id),
        priority_id: priority_id ? BigInt(priority_id) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        created_by,
        notes,
        tender_id,
        donor_client,
        announcement_link,
        submission_deadline: submission_deadline ? new Date(submission_deadline) : undefined,
        initial_notes,
        hr_type,
        leave_type,
        employee_id: employee_id ? BigInt(employee_id) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        days_count: days_count ? parseFloat(days_count) : undefined,
        leave_time_from,
        leave_time_to,
        reason,
        substitute_id: substitute_id ? BigInt(substitute_id) : undefined,
      });

      this.sendSuccess(res, order, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/orders/:id
   * جلب طلب إداري بالـ ID
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const order = await AdminProcedureService.getOrderById(BigInt(id), userId);
      
      if (!order) {
        this.sendError(res, 'الطلب غير موجود أو ليس لديك صلاحية', 404);
        return;
      }
      
      this.sendSuccess(res, order);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/orders
   * جلب كل الطلبات اللي المستخدم يقدر يشوفها
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const { 
        category_id, 
        status_id, 
        is_archived, 
        search, 
        limit = 20, 
        offset = 0 
      } = req.query;

      const filters: any = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      if (category_id) filters.category_id = BigInt(category_id as string);
      if (status_id) filters.status_id = BigInt(status_id as string);
      if (is_archived !== undefined) filters.is_archived = is_archived === 'true';
      if (search) filters.search = search as string;

      const orders = await AdminProcedureService.getOrdersForUser(userId, filters);
      this.sendSuccess(res, orders);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/categories/:categoryId/orders
   * جلب الطلبات حسب القسم
   */
  async getOrdersByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const userId = BigInt(req.user!.user_id);
      const { is_archived, search, limit = 20, offset = 0 } = req.query;

      const filters: any = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      if (is_archived !== undefined) filters.is_archived = is_archived === 'true';
      if (search) filters.search = search as string;

      const orders = await AdminProcedureService.getOrdersByCategory(
        BigInt(categoryId),
        userId,
        filters
      );
      this.sendSuccess(res, orders);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PUT /api/administrative/orders/:id
   * تحديث طلب إداري
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);
      const updates: any = {};

      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.status_id !== undefined) updates.status_id = BigInt(req.body.status_id);
      if (req.body.priority_id !== undefined) {
        updates.priority_id = req.body.priority_id ? BigInt(req.body.priority_id) : null;
      }
      if (req.body.deadline !== undefined) {
        updates.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
      }
      if (req.body.notes !== undefined) updates.notes = req.body.notes;

      const updated = await AdminProcedureService.updateOrder(BigInt(id), updates, userId);
      
      if (!updated) {
        this.sendError(res, 'الطلب غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, updated);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * DELETE /api/administrative/orders/:id
   * حذف طلب إداري
   */
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const deleted = await AdminProcedureService.deleteOrder(BigInt(id), userId);
      
      if (!deleted) {
        this.sendError(res, 'الطلب غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, { deleted: true });
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * POST /api/administrative/orders/:id/archive
   * أرشفة طلب إداري
   */
  async archiveOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = BigInt(req.user!.user_id);

      const result = await AdminProcedureService.archiveOrder(BigInt(id), userId, reason);
      
      if (!result) {
        this.sendError(res, 'فشل في أرشفة الطلب', 400);
        return;
      }
      
      this.sendSuccess(res, { archived: true });
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  // ============ Tasks (المهام الإدارية) ============

  /**
   * POST /api/administrative/tasks
   * إنشاء مهمة إدارية جديدة
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { 
        admin_order_id,
        title,
        description,
        status_id,
        priority_id,
        deadline,
        sequence_order,
        estimated_duration,
        assigned_users,
      } = req.body;

      const created_by = BigInt(req.user!.user_id);

      // التحقق من الصلاحيات
      const hasAccess = await AdminProcedureService.hasAdminAccess(created_by);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لإنشاء مهمة إدارية', 403);
        return;
      }

      // Validate required fields
      if (!admin_order_id || !title || !status_id) {
        this.sendError(res, 'admin_order_id و title و status_id مطلوبين', 400);
        return;
      }

      const task = await AdminProcedureService.createTask({
        admin_order_id: BigInt(admin_order_id),
        title,
        description,
        status_id: BigInt(status_id),
        priority_id: priority_id ? BigInt(priority_id) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        sequence_order,
        created_by,
        estimated_duration,
        assigned_users: assigned_users 
          ? assigned_users.map((id: any) => BigInt(id))
          : undefined,
      });

      this.sendSuccess(res, task, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/tasks/:id
   * جلب مهمة إدارية بالـ ID
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const task = await AdminProcedureService.getTaskById(BigInt(id), userId);
      
      if (!task) {
        this.sendError(res, 'المهمة غير موجودة أو ليس لديك صلاحية', 404);
        return;
      }
      
      this.sendSuccess(res, task);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/orders/:orderId/tasks
   * جلب مهام طلب معين
   */
  async getTasksForOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = BigInt(req.user!.user_id);

      const tasks = await AdminProcedureService.getTasksForOrder(BigInt(orderId), userId);
      this.sendSuccess(res, tasks);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/my-tasks
   * مهامي (المعين عليها أو منشئها)
   */
  async getMyTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const { status_id, is_archived, limit = 20, offset = 0 } = req.query;

      const filters: any = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      if (status_id) filters.status_id = BigInt(status_id as string);
      if (is_archived !== undefined) filters.is_archived = is_archived === 'true';

      const tasks = await AdminProcedureService.getMyTasks(userId, filters);
      this.sendSuccess(res, tasks);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PUT /api/administrative/tasks/:id
   * تحديث مهمة إدارية
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);
      const updates: any = {};

      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.status_id !== undefined) updates.status_id = BigInt(req.body.status_id);
      if (req.body.priority_id !== undefined) {
        updates.priority_id = req.body.priority_id ? BigInt(req.body.priority_id) : null;
      }
      if (req.body.deadline !== undefined) {
        updates.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
      }
      if (req.body.sequence_order !== undefined) updates.sequence_order = req.body.sequence_order;
      if (req.body.estimated_duration !== undefined) updates.estimated_duration = req.body.estimated_duration;

      const updated = await AdminProcedureService.updateTask(BigInt(id), updates, userId);
      
      if (!updated) {
        this.sendError(res, 'المهمة غير موجودة', 404);
        return;
      }
      
      this.sendSuccess(res, updated);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * PATCH /api/administrative/tasks/:id/status
   * تغيير حالة المهمة
   */
  async changeTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status_id, notes } = req.body;
      const userId = BigInt(req.user!.user_id);

      if (!status_id) {
        this.sendError(res, 'status_id مطلوب', 400);
        return;
      }

      const updated = await AdminProcedureService.changeTaskStatus(
        BigInt(id),
        BigInt(status_id),
        userId,
        notes
      );
      
      if (!updated) {
        this.sendError(res, 'المهمة غير موجودة', 404);
        return;
      }
      
      this.sendSuccess(res, updated);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * POST /api/administrative/tasks/:id/assign
   * تعيين مستخدمين على مهمة
   */
  async assignUsersToTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user_ids } = req.body;
      const assignedBy = BigInt(req.user!.user_id);

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        this.sendError(res, 'user_ids مطلوبة (مصفوفة)', 400);
        return;
      }

      // التحقق من الصلاحيات
      const hasAccess = await AdminProcedureService.hasAdminAccess(assignedBy);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لتعيين مستخدمين', 403);
        return;
      }

      const assignments = await AdminProcedureService.assignUsersToTask(
        BigInt(id),
        user_ids.map((uid: any) => BigInt(uid)),
        assignedBy
      );
      
      this.sendSuccess(res, assignments, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/administrative/tasks/:id/assign/:userId
   * إزالة تعيين مستخدم
   */
  async unassignUser(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUser = BigInt(req.user!.user_id);

      // التحقق من الصلاحيات
      const hasAccess = await AdminProcedureService.hasAdminAccess(currentUser);
      if (!hasAccess) {
        this.sendError(res, 'ليس لديك صلاحية لإلغاء التعيين', 403);
        return;
      }

      const result = await AdminProcedureService.unassignUserFromTask(
        BigInt(id),
        BigInt(targetUserId)
      );
      
      this.sendSuccess(res, { unassigned: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/administrative/tasks/:id/archive
   * أرشفة مهمة
   */
  async archiveTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = BigInt(req.user!.user_id);

      const result = await AdminProcedureService.archiveTask(BigInt(id), userId, reason);
      
      if (!result) {
        this.sendError(res, 'فشل في أرشفة المهمة', 400);
        return;
      }
      
      this.sendSuccess(res, { archived: true });
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * DELETE /api/administrative/tasks/:id
   * حذف مهمة
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const deleted = await AdminProcedureService.deleteTask(BigInt(id), userId);
      
      if (!deleted) {
        this.sendError(res, 'المهمة غير موجودة', 404);
        return;
      }
      
      this.sendSuccess(res, { deleted: true });
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  // ============ Comments (التعليقات) ============

  /**
   * POST /api/administrative/tasks/:id/comments
   * إضافة تعليق
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comment, mentioned_user_ids } = req.body;
      const user_id = BigInt(req.user!.user_id);

      if (!comment || comment.trim().length === 0) {
        this.sendError(res, 'التعليق مطلوب', 400);
        return;
      }

      const newComment = await AdminProcedureService.addComment({
        admin_task_id: BigInt(id),
        user_id,
        comment,
        mentioned_user_ids: mentioned_user_ids 
          ? mentioned_user_ids.map((mid: any) => BigInt(mid))
          : undefined,
      });
      
      this.sendSuccess(res, newComment, 201);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * GET /api/administrative/tasks/:id/comments
   * جلب تعليقات مهمة
   */
  async getTaskComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const comments = await AdminProcedureService.getTaskComments(BigInt(id), userId);
      this.sendSuccess(res, comments);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/administrative/comments/:id
   * حذف تعليق
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const deleted = await AdminProcedureService.deleteComment(BigInt(id), userId);
      
      if (!deleted) {
        this.sendError(res, 'التعليق غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PUT /api/administrative/comments/:id
   * تعديل تعليق
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = BigInt(req.user!.user_id);

      if (!comment || comment.trim().length === 0) {
        this.sendError(res, 'التعليق مطلوب', 400);
        return;
      }

      const updated = await AdminProcedureService.updateComment(BigInt(id), userId, comment.trim());
      
      if (!updated) {
        this.sendError(res, 'التعليق غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, updated);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  // ============ Attachments (الملفات المرفقة) ============

  /**
   * POST /api/administrative/tasks/:id/attachments
   * إضافة ملف مرفق
   */
  async addAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, file_url, file_type, file_size } = req.body;
      const uploaded_by = BigInt(req.user!.user_id);

      if (!file_url) {
        this.sendError(res, 'file_url مطلوب', 400);
        return;
      }

      const attachment = await AdminProcedureService.addAttachment({
        admin_task_id: BigInt(id),
        title,
        description,
        file_url,
        file_type,
        file_size: file_size ? BigInt(file_size) : undefined,
        uploaded_by,
      });
      
      this.sendSuccess(res, attachment, 201);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * POST /api/administrative/tasks/:id/upload
   * رفع ملف مرفق إلى bucket الإجراءات الإدارية
   */
  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      const { title, description } = req.body;
      const uploaded_by = BigInt(req.user!.user_id);

      console.log('=== Admin Proc Upload Request ===');
      console.log('Task ID:', id);
      console.log('File:', file ? { 
        name: file.originalname, 
        size: file.size, 
        mimetype: file.mimetype 
      } : 'NO FILE');
      console.log('User ID:', uploaded_by.toString());
      console.log('Title:', title);
      console.log('Description:', description);
      console.log('================================');

      // Validate required fields
      if (!id) {
        this.sendError(res, 'معرف المهمة مطلوب', 400);
        return;
      }
      if (!file) {
        this.sendError(res, 'الملف مطلوب', 400);
        return;
      }

      // التحقق من الصلاحية
      const canAccess = await AdminProcedureService.canUserAccessTask(BigInt(id), uploaded_by);
      const hasFullAccess = await AdminProcedureService.hasAdminAccess(uploaded_by);

      if (!canAccess && !hasFullAccess) {
        this.sendError(res, 'ليس لديك صلاحية لرفع ملفات على هذه المهمة', 403);
        return;
      }

      console.log('Validation passed, uploading to Admin S3...');

      // رفع الملف على bucket الإداري
      const { url, key, bucket } = await AdminProcS3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        `tasks/${id}`,
        title || file.originalname,
        description
      );

      console.log('Admin S3 upload successful:', { url, key, bucket });

      // حفظ المرفق في قاعدة البيانات
      const attachment = await AdminProcedureService.addAttachment({
        admin_task_id: BigInt(id),
        title: title || file.originalname,
        description,
        file_url: url,
        file_type: file.mimetype,
        file_size: BigInt(file.size),
        uploaded_by,
      });

      console.log('Database insert successful:', attachment);

      this.sendSuccess(res, { ...attachment, s3_key: key, bucket }, 201);
    } catch (error) {
      console.error('=== Admin Proc Upload Error ===');
      console.error('Error:', error);
      console.error('================================');
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/tasks/:id/attachments
   * جلب ملفات مهمة
   */
  async getTaskAttachments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const attachments = await AdminProcedureService.getTaskAttachments(BigInt(id), userId);
      this.sendSuccess(res, attachments);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/attachments/:id/download
   * تحميل ملف مباشرة من S3 (streaming) مع التحقق من الصلاحيات
   * الـ backend يحمل الملف من S3 ويرسله مباشرة للمستخدم
   */
  async getAttachmentDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      // جلب المرفق
      const pool = (await import('../../config/database')).default;
      const result = await pool.query(
        `SELECT a.*, t.id as task_id 
         FROM admin_proc_task_attachments a
         INNER JOIN admin_proc_tasks t ON a.admin_task_id = t.id
         WHERE a.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        this.sendError(res, 'الملف غير موجود', 404);
        return;
      }

      const attachment = result.rows[0];

      // التحقق من الصلاحيات
      const canAccess = await AdminProcedureService.canUserAccessTask(
        BigInt(attachment.task_id),
        userId
      );
      const hasFullAccess = await AdminProcedureService.hasAdminAccess(userId);

      if (!canAccess && !hasFullAccess) {
        this.sendError(res, 'ليس لديك صلاحية للوصول لهذا الملف', 403);
        return;
      }

      // استخراج الـ S3 key من الـ URL أو من العمود المخصص
      let s3Key = attachment.s3_key;
      if (!s3Key && attachment.file_url) {
        // استخراج الـ key من الـ URL
        const urlParts = attachment.file_url.split('.amazonaws.com/');
        if (urlParts.length > 1) {
          s3Key = decodeURIComponent(urlParts[1]);
        }
      }

      if (!s3Key) {
        this.sendError(res, 'لا يمكن تحديد مسار الملف', 400);
        return;
      }

      console.log('📥 Streaming file from S3:', s3Key);

      // تحميل الملف من S3 وإرساله مباشرة
      const AWS = (await import('aws-sdk')).default;
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });

      const bucket = attachment.s3_bucket || process.env.AWS_S3_ADMIN_BUCKET || 'admin-procedures-archive';
      
      const s3Params = {
        Bucket: bucket,
        Key: s3Key,
      };

      // جلب الملف من S3
      const s3Object = await s3.getObject(s3Params).promise();

      // تحديد اسم الملف للتنزيل
      const fileName = attachment.title || 'file';
      const encodedFileName = encodeURIComponent(fileName);

      // إعداد headers للتنزيل
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
      res.setHeader('Content-Type', attachment.file_type || s3Object.ContentType || 'application/octet-stream');
      if (s3Object.ContentLength) {
        res.setHeader('Content-Length', s3Object.ContentLength.toString());
      }

      console.log('✅ File streamed successfully:', fileName);

      // إرسال الملف
      res.status(200).send(s3Object.Body);
    } catch (error: any) {
      console.error('❌ Download stream error:', error.message);
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/administrative/attachments/:id
   * حذف ملف مرفق
   */
  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const deleted = await AdminProcedureService.deleteAttachment(BigInt(id), userId);
      
      if (!deleted) {
        this.sendError(res, 'الملف غير موجود', 404);
        return;
      }
      
      this.sendSuccess(res, { deleted: true });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Task History (سجل التغييرات) ============

  /**
   * GET /api/administrative/tasks/:id/history
   * جلب سجل تغييرات المهمة
   */
  async getTaskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const history = await AdminProcedureService.getTaskHistory(BigInt(id), userId);
      this.sendSuccess(res, history);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Archive (الأرشيف) ============

  /**
   * GET /api/administrative/archive
   * جلب الأرشيف الإداري
   */
  async getArchive(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const { search, limit = 20, offset = 0 } = req.query;

      const filters: any = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      if (search) filters.search = search as string;

      const archive = await AdminProcedureService.getArchive(userId, filters);
      this.sendSuccess(res, archive);
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  /**
   * POST /api/administrative/archive/:id/restore
   * استعادة كيان من الأرشيف
   */
  async restoreFromArchive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = BigInt(req.user!.user_id);

      const restored = await AdminProcedureService.restoreFromArchive(BigInt(id), userId);
      
      if (!restored) {
        this.sendError(res, 'فشل في الاستعادة', 400);
        return;
      }
      
      this.sendSuccess(res, { restored: true });
    } catch (error: any) {
      const statusCode = error.message?.includes('صلاحية') ? 403 : 400;
      this.sendError(res, error, statusCode);
    }
  }

  // ============ Helpers ============

  // ============ خدمات الموظفين (متاحة للجميع) ============

  /**
   * POST /api/administrative/leave-request
   * تقديم طلب إجازة/مغادرة (لا يحتاج صلاحية إدارية)
   */
  async submitLeaveRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const {
        hr_type, leave_type, start_date, end_date, days_count,
        leave_time_from, leave_time_to, reason, substitute_id,
      } = req.body;

      if (!hr_type) {
        this.sendError(res, 'نوع الطلب مطلوب (إجازة أو مغادرة)', 400);
        return;
      }

      // جلب اسم الموظف
      const pool = (await import('../../config/database')).default;
      const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const userName = userResult.rows[0]?.name || '';

      const title = hr_type === 'إجازة'
        ? `طلب إجازة ${leave_type || ''} - ${userName}`
        : `طلب مغادرة - ${userName}`;

      const order = await AdminProcedureService.createOrder({
        category_id: BigInt(4), // الموارد البشرية
        title,
        description: reason || undefined,
        status_id: BigInt(1), // مسودة / بانتظار الموافقة
        created_by: userId,
        hr_type,
        leave_type: leave_type || undefined,
        employee_id: userId,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        days_count: days_count ? parseFloat(days_count) : undefined,
        leave_time_from: leave_time_from || undefined,
        leave_time_to: leave_time_to || undefined,
        reason: reason || undefined,
        substitute_id: substitute_id ? BigInt(substitute_id) : undefined,
      });

      this.sendSuccess(res, order, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/administrative/my-leave-requests
   * جلب طلبات الإجازة/المغادرة الخاصة بالمستخدم الحالي
   */
  async getMyLeaveRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = BigInt(req.user!.user_id);
      const pool = (await import('../../config/database')).default;

      const result = await pool.query(
        `SELECT 
          o.*,
          s.name as status_name,
          sub.name as substitute_name
        FROM admin_proc_orders o
        LEFT JOIN order_statuses s ON o.status_id = s.id
        LEFT JOIN users sub ON o.substitute_id = sub.id
        WHERE o.category_id = 4 AND o.employee_id = $1
        ORDER BY o.created_at DESC`,
        [userId]
      );

      this.sendSuccess(res, result.rows);
    } catch (error) {
      this.sendError(res, error, 400);
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

  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
