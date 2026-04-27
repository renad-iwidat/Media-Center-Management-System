import { Request, Response } from 'express';
import { ShootingService } from '../../services/management/ShootingService';

export class ShootingController {
  private shootingService: ShootingService;

  constructor() {
    this.shootingService = new ShootingService();
  }

  async createShooting(req: Request, res: Response): Promise<void> {
    try {
      const { order_id, task_id, location, start_time, end_time, equipment, crew, notes, source_type, created_by } = req.body;

      if (!order_id || !location || !start_time || !created_by) {
        this.sendError(res, 'order_id, location, start_time, and created_by are required', 400);
        return;
      }

      const shooting = await this.shootingService.createShooting({
        order_id: BigInt(order_id),
        task_id: task_id ? BigInt(task_id) : undefined,
        location,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : undefined,
        equipment: equipment || [],
        crew: crew || [],
        notes,
        source_type: source_type || 'internal',
        created_by: BigInt(created_by),
      });

      this.sendSuccess(res, shooting, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getShooting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const shooting = await this.shootingService.getShooting(BigInt(id));
      this.sendSuccess(res, shooting);
    } catch (error) {
      this.sendError(res, error, 404);
    }
  }

  async getAllShootings(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const shootings = await this.shootingService.getAllShootings(limit, offset);
      this.sendSuccess(res, shootings);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async updateShooting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { location, start_time, end_time, equipment, crew, notes } = req.body;

      const updates: any = {};
      if (location !== undefined) updates.location = location;
      if (start_time !== undefined) updates.start_time = new Date(start_time);
      if (end_time !== undefined) updates.end_time = new Date(end_time);
      if (equipment !== undefined) updates.equipment = equipment;
      if (crew !== undefined) updates.crew = crew;
      if (notes !== undefined) updates.notes = notes;

      const shooting = await this.shootingService.updateShooting(BigInt(id), updates);
      this.sendSuccess(res, shooting);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async deleteShooting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.shootingService.deleteShooting(BigInt(id));
      this.sendSuccess(res, { deleted: result });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getShootingsByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const shootings = await this.shootingService.getShootingsByOrder(BigInt(orderId));
      this.sendSuccess(res, shootings);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getShootingsByTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const shootings = await this.shootingService.getShootingsByTask(BigInt(taskId));
      this.sendSuccess(res, shootings);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getShootingsByCreator(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const shootings = await this.shootingService.getShootingsByCreator(BigInt(userId), limit, offset);
      this.sendSuccess(res, shootings);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Enriched Views ============

  async getShootingEnriched(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.shootingService.getShootingEnriched(BigInt(req.params.id));
      if (!result) { this.sendError(res, 'Shooting not found', 404); return; }
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getAllShootingsEnriched(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const result = await this.shootingService.getAllShootingsEnriched(limit, offset);
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getShootingFull(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.shootingService.getShootingFull(BigInt(req.params.id));
      if (!result) { this.sendError(res, 'Shooting not found', 404); return; }
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() });
  }

  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({ success: false, error: message, timestamp: new Date().toISOString() });
  }
}
