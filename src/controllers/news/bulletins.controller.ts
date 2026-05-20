import { Request, Response } from 'express';
import bulletinsService from '../../services/news/bulletins.service';

/**
 * BulletinsController
 * التحكم في الموجزات والنشرات المحفوظة
 */

/**
 * POST /api/bulletins
 * حفظ موجز/نشرة جديدة
 */
export async function createBulletin(req: Request, res: Response): Promise<void> {
  try {
    const { media_unit_id, type, time_of_day, title, original_content, edited_content, news_count } = req.body;
    const userId = req.user?.user_id;

    if (!media_unit_id || !original_content) {
      res.status(400).json({ success: false, message: 'media_unit_id و original_content مطلوبان' });
      return;
    }

    const bulletin = await bulletinsService.create({
      media_unit_id,
      type: type || 'summary',
      time_of_day: time_of_day || 'morning',
      title: title || '',
      original_content,
      edited_content,
      news_count: news_count || 0,
      created_by: userId ? parseInt(userId) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'تم حفظ الموجز/النشرة بنجاح',
      data: bulletin,
    });
  } catch (error) {
    console.error('❌ خطأ في حفظ الموجز/النشرة:', error);
    res.status(500).json({ success: false, message: 'فشل حفظ الموجز/النشرة' });
  }
}

/**
 * GET /api/bulletins
 * جلب جميع الموجزات/النشرات
 */
export async function getBulletins(req: Request, res: Response): Promise<void> {
  try {
    const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const bulletins = await bulletinsService.getAll(mediaUnitId, limit);

    res.status(200).json({
      success: true,
      data: bulletins,
      count: bulletins.length,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الموجزات/النشرات:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الموجزات/النشرات' });
  }
}

/**
 * GET /api/bulletins/:id
 * جلب موجز/نشرة بالـ ID
 */
export async function getBulletinById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'معرف غير صحيح' });
      return;
    }

    const bulletin = await bulletinsService.getById(id);
    if (!bulletin) {
      res.status(404).json({ success: false, message: 'الموجز/النشرة غير موجودة' });
      return;
    }

    res.status(200).json({ success: true, data: bulletin });
  } catch (error) {
    console.error('❌ خطأ في جلب الموجز/النشرة:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الموجز/النشرة' });
  }
}

/**
 * PUT /api/bulletins/:id
 * تحديث موجز/نشرة (تعديل المحرر)
 */
export async function updateBulletin(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'معرف غير صحيح' });
      return;
    }

    const { edited_content, title, status } = req.body;
    const userId = req.user?.user_id;

    const bulletin = await bulletinsService.update(id, {
      edited_content,
      title,
      status,
      updated_by: userId ? parseInt(userId) : undefined,
    });

    if (!bulletin) {
      res.status(404).json({ success: false, message: 'الموجز/النشرة غير موجودة' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث الموجز/النشرة بنجاح',
      data: bulletin,
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث الموجز/النشرة:', error);
    res.status(500).json({ success: false, message: 'فشل تحديث الموجز/النشرة' });
  }
}

/**
 * DELETE /api/bulletins/:id
 * حذف موجز/نشرة
 */
export async function deleteBulletin(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'معرف غير صحيح' });
      return;
    }

    const deleted = await bulletinsService.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'الموجز/النشرة غير موجودة' });
      return;
    }

    res.status(200).json({ success: true, message: 'تم حذف الموجز/النشرة بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف الموجز/النشرة:', error);
    res.status(500).json({ success: false, message: 'فشل حذف الموجز/النشرة' });
  }
}

/**
 * PATCH /api/bulletins/:id/audio
 * تحديث حالة الصوت
 */
export async function markAudioGenerated(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'معرف غير صحيح' });
      return;
    }

    await bulletinsService.markAudioGenerated(id);
    res.status(200).json({ success: true, message: 'تم تحديث حالة الصوت' });
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الصوت:', error);
    res.status(500).json({ success: false, message: 'فشل تحديث حالة الصوت' });
  }
}
