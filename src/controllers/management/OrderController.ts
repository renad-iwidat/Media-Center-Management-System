import { Request, Response } from 'express';
import { OrderService } from '../../services/management/OrderService';
import { OrderAutomationService } from '../../services/management/OrderAutomationService';
import { KPIService } from '../../services/management/KPIService';

/**
 * OrderController - Handles all Order-related API endpoints
 * 
 * Responsibilities:
 * - Handle HTTP requests/responses
 * - Validate request data
 * - Call OrderService methods
 * - Format and send responses
 */
export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // ============ CRUD Operations ============

  /**
   * POST /api/orders
   * Create a new order
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, desk_id, status_id, priority_id, media_unit_id, created_by, deadline, program_id, episode_id, new_program, notes } = req.body;

      // Validate required fields
      if (!title || !desk_id || !status_id || !priority_id || !media_unit_id || !created_by) {
        this.sendError(res, 'Missing required fields', 400);
        return;
      }

      let resolvedProgramId = program_id ? BigInt(program_id) : undefined;

      // If new_program is provided, create the program first
      if (new_program && !program_id) {
        if (!new_program.title) {
          this.sendError(res, 'new_program.title is required', 400);
          return;
        }
        const { ProgramModel } = await import('../../models/content/Program');
        const program = await ProgramModel.create({
          title: new_program.title,
          description: new_program.description,
          media_unit_id: media_unit_id ? BigInt(media_unit_id) : undefined,
          air_time: new_program.air_time,
        });
        resolvedProgramId = program.id;
      }

      const order = await this.orderService.createOrder({
        title,
        description,
        desk_id: BigInt(desk_id),
        status_id: BigInt(status_id),
        priority_id: BigInt(priority_id),
        media_unit_id: BigInt(media_unit_id),
        created_by: BigInt(created_by),
        deadline: deadline ? new Date(deadline) : undefined,
        program_id: resolvedProgramId,
        episode_id: (episode_id && episode_id !== 0 && episode_id !== '0') ? BigInt(episode_id) : undefined,
        notes,
      });

      this.sendSuccess(res, order, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id
   * Get a single order by ID
   */
  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const order = await this.orderService.getOrder(BigInt(id));
      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 404);
    }
  }

  /**
   * GET /api/orders
   * Get all orders with pagination
   */
  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const orders = await this.orderService.getAllOrders(limit, offset);
      this.sendSuccess(res, orders, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PUT /api/orders/:id
   * Update an order
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, deadline, program_id, episode_id } = req.body;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (deadline) updates.deadline = new Date(deadline);
      if (program_id) updates.program_id = BigInt(program_id);
      if (episode_id) updates.episode_id = BigInt(episode_id);

      const order = await this.orderService.updateOrder(BigInt(id), updates);
      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * DELETE /api/orders/:id
   * Delete an order
   */
  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const result = await this.orderService.deleteOrder(BigInt(id));
      this.sendSuccess(res, { deleted: result }, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Status Management ============

  /**
   * PATCH /api/orders/:id/status
   * Change order status
   */
  async changeOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status_id, changed_by } = req.body;

      if (!id || !status_id || !changed_by) {
        this.sendError(res, 'Order ID, status_id, and changed_by are required', 400);
        return;
      }

      // Use automation service to handle status change with automatic updates
      const order = await OrderAutomationService.handleOrderStatusChange(
        BigInt(id),
        BigInt(status_id),
        BigInt(changed_by)
      );

      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PATCH /api/orders/:id/cancel
   * Cancel an order (soft delete)
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cancelled_by, reason } = req.body;

      if (!id || !cancelled_by) {
        this.sendError(res, 'Order ID and cancelled_by are required', 400);
        return;
      }

      const order = await this.orderService.cancelOrder(
        BigInt(id),
        BigInt(cancelled_by),
        reason
      );

      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/statuses
   * Get all available order statuses
   */
  async getOrderStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = await this.orderService.getOrderStatuses();
      this.sendSuccess(res, statuses, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/history
   * Get order status change history
   */
  async getOrderHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const history = await this.orderService.getOrderHistory(BigInt(id));
      this.sendSuccess(res, history, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Filtering & Search ============

  /**
   * GET /api/orders/desk/:deskId
   * Get orders by desk
   */
  async getOrdersByDesk(req: Request, res: Response): Promise<void> {
    try {
      const { deskId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!deskId) {
        this.sendError(res, 'Desk ID is required', 400);
        return;
      }

      const orders = await this.orderService.getOrdersByDesk(BigInt(deskId), limit, offset);
      this.sendSuccess(res, orders, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/status/:statusId
   * Get orders by status
   */
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { statusId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!statusId) {
        this.sendError(res, 'Status ID is required', 400);
        return;
      }

      const orders = await this.orderService.getOrdersByStatus(BigInt(statusId), limit, offset);
      this.sendSuccess(res, orders, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/program/:programId
   * Get orders by program
   */
  async getOrdersByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      if (!programId) {
        this.sendError(res, 'Program ID is required', 400);
        return;
      }

      const orders = await this.orderService.getOrdersByProgram(BigInt(programId), limit, offset);
      this.sendSuccess(res, orders, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Business Logic ============

  /**
   * GET /api/orders/:id/progress
   * Calculate order progress
   */
  async calculateOrderProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const progress = await this.orderService.calculateOrderProgress(BigInt(id));
      this.sendSuccess(res, progress, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/deadline
   * Validate order deadline
   */
  async validateOrderDeadline(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const result = await this.orderService.validateOrderDeadline(BigInt(id));
      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/can-delete
   * Check if order can be deleted
   */
  async canDeleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const result = await this.orderService.canDeleteOrder(BigInt(id));
      this.sendSuccess(res, result, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/details
   * Get order with all details (tasks, progress, history)
   */
  async getOrderWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const order = await this.orderService.getOrderWithDetails(BigInt(id));
      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * PATCH /api/orders/:id/auto-status
   * Auto-update order status based on task statuses
   */
  async updateOrderStatusBasedOnTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { changed_by } = req.body;

      if (!id || !changed_by) {
        this.sendError(res, 'Order ID and changed_by are required', 400);
        return;
      }

      const order = await this.orderService.updateOrderStatusBasedOnTasks(
        BigInt(id),
        BigInt(changed_by)
      );

      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Helper Methods ============

  /**
   * GET /api/orders/:id/kpi
   * Get order KPI
   */
  async getOrderKPI(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const kpi = await KPIService.getOrderKPI(BigInt(id));

      if (!kpi) {
        this.sendError(res, 'KPI not found for this order', 404);
        return;
      }

      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/statistics
   * Get order statistics
   */
  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const statistics = await OrderAutomationService.getOrderStatistics(BigInt(id));

      if (!statistics) {
        this.sendError(res, 'Statistics not found for this order', 404);
        return;
      }

      this.sendSuccess(res, statistics, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/:id/full-details
   * Get order with all relations and KPI
   */
  async getOrderFullDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const order = await OrderAutomationService.getOrderWithRelations(BigInt(id));

      if (!order) {
        this.sendError(res, 'Order not found', 404);
        return;
      }

      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/orders/:id/archive
   * Archive order
   */
  async archiveOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { archived_by } = req.body;

      if (!id || !archived_by) {
        this.sendError(res, 'Order ID and archived_by are required', 400);
        return;
      }

      const order = await OrderAutomationService.handleOrderArchive(
        BigInt(id),
        BigInt(archived_by)
      );

      this.sendSuccess(res, order, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/orders/all-with-kpi
   * Get all orders with KPI
   */
  async getAllOrdersWithKPI(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const orders = await OrderAutomationService.getAllOrdersWithKPI(limit, offset);
      this.sendSuccess(res, orders, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Helper Methods ============

  /**
   * Send success response
   */
  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   */
  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
