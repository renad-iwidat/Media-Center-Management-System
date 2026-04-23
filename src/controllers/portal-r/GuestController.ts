/**
 * Guest Controller
 * Handles guest-related HTTP requests
 */

import { Request, Response } from 'express';
import { GuestService } from '../../services/portal-r';

const guestService = new GuestService();

export class GuestController {
  /**
   * GET /guests - Get all guests
   */
  static async getAllGuests(req: Request, res: Response): Promise<void> {
    try {
      console.log('Getting all guests...');
      const guests = await guestService.getAllGuests();
      console.log(`Found ${guests.length} guests`);
      res.json({
        success: true,
        data: guests,
        count: guests.length,
      });
    } catch (error) {
      console.error('Error getting guests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch guests',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /guests/:id - Get guest by ID
   */
  static async getGuestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const guest = await guestService.getGuestById(BigInt(id));

      if (!guest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guest,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /guests/search - Search guests by name
   */
  static async searchGuests(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.query;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search name is required',
        });
        return;
      }

      const guests = await guestService.searchGuestsByName(name);

      res.json({
        success: true,
        data: guests,
        count: guests.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search guests',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /guests - Create a new guest
   */
  static async createGuest(req: Request, res: Response): Promise<void> {
    try {
      const { name, title, bio, phone } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Guest name is required',
        });
        return;
      }

      const guest = await guestService.createGuest({
        name,
        title,
        bio,
        phone,
      });

      res.status(201).json({
        success: true,
        data: guest,
        message: 'Guest created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /guests/:id - Update a guest
   */
  static async updateGuest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, title, bio, phone } = req.body;

      const guest = await guestService.updateGuest(BigInt(id), {
        name,
        title,
        bio,
        phone,
      });

      if (!guest) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      res.json({
        success: true,
        data: guest,
        message: 'Guest updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /guests/:id - Delete a guest
   */
  static async deleteGuest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await guestService.deleteGuest(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Guest not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Guest deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete guest',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
