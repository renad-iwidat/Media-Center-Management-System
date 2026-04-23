/**
 * MediaUnit Controller
 * Handles HTTP requests for media unit operations
 */

import { Request, Response } from 'express';
import { MediaUnitService } from '../../services/portal-r';

const mediaUnitService = new MediaUnitService();

export class MediaUnitController {
  /**
   * Get all media units
   */
  static async getAllMediaUnits(req: Request, res: Response): Promise<void> {
    try {
      const mediaUnits = await mediaUnitService.getAllMediaUnits();
      res.json({
        success: true,
        data: mediaUnits,
      });
    } catch (error: any) {
      console.error('Error fetching media units:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل في جلب الوحدات الإعلامية',
      });
    }
  }

  /**
   * Get media unit by ID
   */
  static async getMediaUnitById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mediaUnit = await mediaUnitService.getMediaUnitById(BigInt(id));

      if (!mediaUnit) {
        res.status(404).json({
          success: false,
          message: 'الوحدة الإعلامية غير موجودة',
        });
        return;
      }

      res.json({
        success: true,
        data: mediaUnit,
      });
    } catch (error: any) {
      console.error('Error fetching media unit:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل في جلب الوحدة الإعلامية',
      });
    }
  }

  /**
   * Create a new media unit
   */
  static async createMediaUnit(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'الاسم مطلوب',
        });
        return;
      }

      const mediaUnit = await mediaUnitService.createMediaUnit({
        name,
        description,
      });

      res.status(201).json({
        success: true,
        data: mediaUnit,
      });
    } catch (error: any) {
      console.error('Error creating media unit:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل في إنشاء الوحدة الإعلامية',
      });
    }
  }

  /**
   * Update a media unit
   */
  static async updateMediaUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const mediaUnit = await mediaUnitService.updateMediaUnit(BigInt(id), {
        name,
        description,
      });

      if (!mediaUnit) {
        res.status(404).json({
          success: false,
          message: 'الوحدة الإعلامية غير موجودة',
        });
        return;
      }

      res.json({
        success: true,
        data: mediaUnit,
      });
    } catch (error: any) {
      console.error('Error updating media unit:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل في تحديث الوحدة الإعلامية',
      });
    }
  }

  /**
   * Delete a media unit
   */
  static async deleteMediaUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await mediaUnitService.deleteMediaUnit(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'الوحدة الإعلامية غير موجودة',
        });
        return;
      }

      res.json({
        success: true,
        message: 'تم حذف الوحدة الإعلامية بنجاح',
      });
    } catch (error: any) {
      console.error('Error deleting media unit:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل في حذف الوحدة الإعلامية',
      });
    }
  }
}
