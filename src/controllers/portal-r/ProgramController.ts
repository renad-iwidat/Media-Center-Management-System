/**
 * Program Controller
 * Handles program-related HTTP requests
 */

import { Request, Response } from 'express';
import { ProgramService } from '../../services/portal-r';

const programService = new ProgramService();

export class ProgramController {
  /**
   * GET /programs - Get all programs
   */
  static async getAllPrograms(req: Request, res: Response): Promise<void> {
    try {
      const programs = await programService.getAllPrograms();
      res.json({
        success: true,
        data: programs,
        count: programs.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch programs',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:id - Get program by ID
   */
  static async getProgramById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const program = await programService.getProgramById(BigInt(id));

      if (!program) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
        });
        return;
      }

      res.json({
        success: true,
        data: program,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:id/with-episodes - Get program with episodes
   */
  static async getProgramWithEpisodes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const program = await programService.getProgramWithEpisodes(BigInt(id));

      if (!program) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
        });
        return;
      }

      res.json({
        success: true,
        data: program,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:id/with-roles - Get program with team members
   */
  static async getProgramWithRoles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const program = await programService.getProgramWithRoles(BigInt(id));

      if (!program) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
        });
        return;
      }

      res.json({
        success: true,
        data: program,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /programs - Create a new program
   */
  static async createProgram(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, media_unit_id, air_time } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          error: 'Program title is required',
        });
        return;
      }

      const program = await programService.createProgram({
        title,
        description,
        media_unit_id: media_unit_id ? BigInt(media_unit_id) : undefined,
        air_time,
      });

      res.status(201).json({
        success: true,
        data: program,
        message: 'Program created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /programs/:id - Update a program
   */
  static async updateProgram(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, media_unit_id, air_time } = req.body;

      const program = await programService.updateProgram(BigInt(id), {
        title,
        description,
        media_unit_id: media_unit_id ? BigInt(media_unit_id) : undefined,
        air_time,
      });

      if (!program) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
        });
        return;
      }

      res.json({
        success: true,
        data: program,
        message: 'Program updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /programs/:id - Delete a program
   */
  static async deleteProgram(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await programService.deleteProgram(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Program deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete program',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
