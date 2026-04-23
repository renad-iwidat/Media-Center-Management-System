/**
 * Episode Guest Controller
 * Handles episode guest-related HTTP requests
 */

import { Request, Response } from 'express';
import { EpisodeGuestService } from '../../services/portal-r';

const episodeGuestService = new EpisodeGuestService();

export class EpisodeGuestController {
  /**
   * GET /episode-guests - Get all episode guests or filter by episode_id/guest_id
   */
  static async getAllEpisodeGuests(req: Request, res: Response): Promise<void> {
    try {
      const { episode_id, guest_id } = req.query;

      let guests;
      if (episode_id) {
        guests = await episodeGuestService.getGuestsByEpisodeId(BigInt(String(episode_id)));
      } else if (guest_id) {
        guests = await episodeGuestService.getEpisodesByGuestId(BigInt(String(guest_id)));
      } else {
        guests = await episodeGuestService.getAllEpisodeGuests();
      }

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

  /**
   * POST /episode-guests - Create a new episode guest
   */
  static async createEpisodeGuest(req: Request, res: Response): Promise<void> {
    try {
      const { episode_id, guest_id } = req.body;

      if (!episode_id || !guest_id) {
        res.status(400).json({
          success: false,
          error: 'Episode ID and guest ID are required',
        });
        return;
      }

      // Check if guest already in episode
      const exists = await episodeGuestService.guestInEpisode(BigInt(episode_id), BigInt(guest_id));
      if (exists) {
        res.status(400).json({
          success: false,
          error: 'Guest already in this episode',
        });
        return;
      }

      const episodeGuest = await episodeGuestService.createEpisodeGuest(
        BigInt(episode_id),
        BigInt(guest_id),
      );

      res.status(201).json({
        success: true,
        data: episodeGuest,
        message: 'Episode guest created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create episode guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /episode-guests/:episodeId/:guestId - Delete an episode guest
   */
  static async deleteEpisodeGuest(req: Request, res: Response): Promise<void> {
    try {
      const { episodeId, guestId } = req.params;
      const deleted = await episodeGuestService.deleteEpisodeGuest(BigInt(episodeId), BigInt(guestId));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Episode guest not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Episode guest deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete episode guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
