/**
 * Episode Controller
 * Handles episode-related HTTP requests
 */

import { Request, Response } from 'express';
import { EpisodeService } from '../../services/portal-r';

const episodeService = new EpisodeService();

export class EpisodeController {
  /**
   * GET /episodes - Get all episodes
   */
  static async getAllEpisodes(req: Request, res: Response): Promise<void> {
    try {
      const episodes = await episodeService.getAllEpisodes();
      res.json({
        success: true,
        data: episodes,
        count: episodes.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /episodes/:id - Get episode by ID
   */
  static async getEpisodeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const episode = await episodeService.getEpisodeById(BigInt(id));

      if (!episode) {
        res.status(404).json({
          success: false,
          error: 'Episode not found',
        });
        return;
      }

      res.json({
        success: true,
        data: episode,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /episodes/:id/with-guests - Get episode with guests
   */
  static async getEpisodeWithGuests(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const episode = await episodeService.getEpisodeWithGuests(BigInt(id));

      if (!episode) {
        res.status(404).json({
          success: false,
          error: 'Episode not found',
        });
        return;
      }

      res.json({
        success: true,
        data: episode,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /episodes?program_id=X - Get episodes by program
   */
  static async getEpisodesByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { program_id } = req.query;
      
      if (!program_id) {
        res.status(400).json({
          success: false,
          error: 'Program ID is required',
        });
        return;
      }

      const episodes = await episodeService.getEpisodesByProgramId(BigInt(String(program_id)));

      res.json({
        success: true,
        data: episodes,
        count: episodes.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episodes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /episodes - Create a new episode
   */
  static async createEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { program_id, title, episode_number, air_date } = req.body;

      if (!program_id || !title) {
        res.status(400).json({
          success: false,
          error: 'Program ID and episode title are required',
        });
        return;
      }

      const episode = await episodeService.createEpisode({
        program_id: BigInt(program_id),
        title,
        episode_number,
        air_date: air_date ? new Date(air_date) : undefined,
      });

      res.status(201).json({
        success: true,
        data: episode,
        message: 'Episode created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /episodes/:id - Update an episode
   */
  static async updateEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, episode_number, air_date } = req.body;

      const episode = await episodeService.updateEpisode(BigInt(id), {
        title,
        episode_number,
        air_date: air_date ? new Date(air_date) : undefined,
      });

      if (!episode) {
        res.status(404).json({
          success: false,
          error: 'Episode not found',
        });
        return;
      }

      res.json({
        success: true,
        data: episode,
        message: 'Episode updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /episodes/:id - Delete an episode
   */
  static async deleteEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await episodeService.deleteEpisode(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Episode not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Episode deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /episodes/:id/guests - Add guest to episode
   */
  static async addGuestToEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { guest_id } = req.body;

      if (!guest_id) {
        res.status(400).json({
          success: false,
          error: 'Guest ID is required',
        });
        return;
      }

      const added = await episodeService.addGuestToEpisode(BigInt(id), BigInt(guest_id));

      if (!added) {
        res.status(400).json({
          success: false,
          error: 'Failed to add guest to episode',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Guest added to episode successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add guest to episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /episodes/:id/guests/:guestId - Remove guest from episode
   */
  static async removeGuestFromEpisode(req: Request, res: Response): Promise<void> {
    try {
      const { id, guestId } = req.params;
      const removed = await episodeService.removeGuestFromEpisode(BigInt(id), BigInt(guestId));

      if (!removed) {
        res.status(404).json({
          success: false,
          error: 'Guest not found in episode',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Guest removed from episode successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to remove guest from episode',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /episodes/:id/guests - Get episode guests
   */
  static async getEpisodeGuests(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const guests = await episodeService.getEpisodeGuests(BigInt(id));

      res.json({
        success: true,
        data: guests,
        count: guests.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch episode guests',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
