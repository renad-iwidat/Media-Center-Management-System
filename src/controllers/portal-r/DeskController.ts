/**
 * Desk Controller
 * Handles desk-related HTTP requests
 */

import { Request, Response } from 'express';
import { DeskService } from '../../services/portal-r';

const deskService = new DeskService();

export class DeskController {
  /**
   * GET /desks - Get all desks
   */
  static async getAllDesks(req: Request, res: Response): Promise<void> {
    try {
      const desks = await deskService.getAllDesks();
      res.json({
        success: true,
        data: desks,
        count: desks.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch desks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /desks/:id - Get desk by ID
   */
  static async getDeskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const desk = await deskService.getDeskById(BigInt(id));

      if (!desk) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
        });
        return;
      }

      res.json({
        success: true,
        data: desk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch desk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /desks/:id/with-teams - Get desk with teams
   */
  static async getDeskWithTeams(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const desk = await deskService.getDeskWithTeams(BigInt(id));

      if (!desk) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
        });
        return;
      }

      res.json({
        success: true,
        data: desk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch desk with teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /desks - Create a new desk
   */
  static async createDesk(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, manager_id } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Desk name is required',
        });
        return;
      }

      const desk = await deskService.createDesk({
        name,
        description,
        manager_id: manager_id ? BigInt(manager_id) : undefined,
      });

      res.status(201).json({
        success: true,
        data: desk,
        message: 'Desk created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create desk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /desks/:id - Update a desk
   */
  static async updateDesk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, manager_id } = req.body;

      const desk = await deskService.updateDesk(BigInt(id), {
        name,
        description,
        manager_id: manager_id ? BigInt(manager_id) : undefined,
      });

      if (!desk) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
        });
        return;
      }

      res.json({
        success: true,
        data: desk,
        message: 'Desk updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update desk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /desks/:id - Delete a desk
   */
  static async deleteDesk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await deskService.deleteDesk(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Desk not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Desk deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete desk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
