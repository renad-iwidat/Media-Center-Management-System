/**
 * Programs Controller
 * التحكم بطلبات البرامج والحلقات والضيوف
 */

import { Request, Response } from 'express';
import { ProgramsService, GuestsService } from '../../services/database/programs.service';

export class ProgramsController {
  /**
   * الحصول على جميع البرامج
   */
  static async getAllPrograms(req: Request, res: Response) {
    try {
      const programs = await ProgramsService.getAll();
      res.json({ success: true, data: programs, count: programs.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على برنامج بالـ ID
   */
  static async getProgramById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const program = await ProgramsService.getById(parseInt(id));
      if (!program) {
        return res.status(404).json({ success: false, error: 'Program not found' });
      }
      res.json({ success: true, data: program });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على حلقات برنامج معين
   */
  static async getEpisodesByProgram(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const episodes = await ProgramsService.getEpisodesByProgramId(parseInt(id));
      res.json({ success: true, data: episodes, count: episodes.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على حلقة بالـ ID مع ضيوفها
   */
  static async getEpisodeWithGuests(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const episode = await ProgramsService.getEpisodeWithGuests(parseInt(id));
      if (!episode) {
        return res.status(404).json({ success: false, error: 'Episode not found' });
      }
      res.json({ success: true, data: episode });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export class GuestsController {
  /**
   * الحصول على جميع الضيوف أو بحث أو آخر N ضيوف
   * GET /api/guests          → آخر 2 ضيوف (default)
   * GET /api/guests?search=x → بحث
   * GET /api/guests?recent=5 → آخر 5 ضيوف
   */
  static async getAllGuests(req: Request, res: Response) {
    try {
      const { search, recent } = req.query;

      let guests;
      if (search && typeof search === 'string' && search.trim()) {
        guests = await GuestsService.search(search.trim());
      } else {
        const limit = recent ? parseInt(recent as string) || 2 : 2;
        guests = await GuestsService.getRecent(limit);
      }

      res.json({ success: true, data: guests, count: guests.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على ضيف بالـ ID
   */
  static async getGuestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guest = await GuestsService.getById(parseInt(id));
      if (!guest) {
        return res.status(404).json({ success: false, error: 'Guest not found' });
      }
      res.json({ success: true, data: guest });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على ضيوف حلقة معينة
   */
  static async getGuestsByEpisode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const guests = await GuestsService.getByEpisodeId(parseInt(id));
      res.json({ success: true, data: guests, count: guests.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
