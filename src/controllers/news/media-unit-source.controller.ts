/**
 * Media Unit Source Controller
 * متحكم إدارة ربط المصادر بالوحدات الإعلامية
 */

import { Request, Response } from 'express';
import { MediaUnitSourceService } from '../../services/database/media-unit-source.service';
import { SourceService } from '../../services/database/database.service';
import { query } from '../../config/database';

/**
 * GET /api/data/media-units/with-sources
 * جلب كل الوحدات الإعلامية مع مصادرها
 */
export async function getMediaUnitsWithSources(_req: Request, res: Response): Promise<void> {
  try {
    const units = await MediaUnitSourceService.getAllWithSources();
    res.status(200).json({
      success: true,
      count: units.length,
      data: units,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الوحدات مع مصادرها:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الوحدات الإعلامية' });
  }
}

/**
 * GET /api/data/media-units/:slug/sources
 * جلب مصادر وحدة إعلامية محددة
 */
export async function getMediaUnitSources(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const unit = await MediaUnitSourceService.getBySlugWithSources(slug);

    if (!unit) {
      res.status(404).json({ success: false, message: 'الوحدة الإعلامية غير موجودة' });
      return;
    }

    res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب مصادر الوحدة:', error);
    res.status(500).json({ success: false, message: 'فشل جلب مصادر الوحدة' });
  }
}

/**
 * POST /api/data/media-units/:slug/sources
 * ربط مصدر بوحدة إعلامية
 * Body: { source_id: number, priority?: number }
 */
export async function linkSourceToMediaUnit(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const { source_id, priority = 1 } = req.body;

    if (!source_id) {
      res.status(400).json({ success: false, message: 'source_id مطلوب' });
      return;
    }

    // التحقق من وجود الوحدة
    const unit = await MediaUnitSourceService.getBySlug(slug);
    if (!unit) {
      res.status(404).json({ success: false, message: 'الوحدة الإعلامية غير موجودة' });
      return;
    }

    // التحقق من وجود المصدر
    const source = await SourceService.getById(source_id);
    if (!source) {
      res.status(404).json({ success: false, message: 'المصدر غير موجود' });
      return;
    }

    const link = await MediaUnitSourceService.linkSource(unit.id, source_id, priority);

    res.status(201).json({
      success: true,
      message: `تم ربط المصدر "${source.name}" بالوحدة "${unit.name}"`,
      data: link,
    });
  } catch (error) {
    console.error('❌ خطأ في ربط المصدر:', error);
    res.status(500).json({ success: false, message: 'فشل ربط المصدر بالوحدة' });
  }
}

/**
 * DELETE /api/data/media-units/:slug/sources/:sourceId
 * إلغاء ربط مصدر من وحدة إعلامية
 */
export async function unlinkSourceFromMediaUnit(req: Request, res: Response): Promise<void> {
  try {
    const { slug, sourceId } = req.params;
    const sourceIdNum = parseInt(sourceId);

    if (isNaN(sourceIdNum)) {
      res.status(400).json({ success: false, message: 'معرف المصدر غير صحيح' });
      return;
    }

    const unit = await MediaUnitSourceService.getBySlug(slug);
    if (!unit) {
      res.status(404).json({ success: false, message: 'الوحدة الإعلامية غير موجودة' });
      return;
    }

    const unlinked = await MediaUnitSourceService.unlinkSource(unit.id, sourceIdNum);

    if (!unlinked) {
      res.status(404).json({ success: false, message: 'الربط غير موجود' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تم إلغاء ربط المصدر من الوحدة',
    });
  } catch (error) {
    console.error('❌ خطأ في إلغاء ربط المصدر:', error);
    res.status(500).json({ success: false, message: 'فشل إلغاء ربط المصدر' });
  }
}

/**
 * POST /api/data/media-units/:slug/sources/sync
 * مزامنة مصادر وحدة إعلامية من NewsDesk API
 * يجلب المصادر المرتبطة بالوحدة من الـ API ويربطها محلياً
 */
export async function syncMediaUnitSources(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const unit = await MediaUnitSourceService.getBySlug(slug);
    if (!unit) {
      res.status(404).json({ success: false, message: 'الوحدة الإعلامية غير موجودة' });
      return;
    }

    // جلب المصادر من NewsDesk API
    const { newsDeskApiService } = await import('../../services/news/newsdesk-api.service');
    
    // نستخدم /media-units/{slug} من الـ API الخارجي لجلب المصادر المرتبطة
    const NEWSDESK_API_BASE = process.env.NEWSDESK_API_URL || 'https://newsdesk-api.liminal.ps';
    const response = await fetch(`${NEWSDESK_API_BASE}/media-units/${slug}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      res.status(404).json({ success: false, message: `الوحدة "${slug}" غير موجودة في NewsDesk API` });
      return;
    }

    const apiUnit = await response.json() as any;
    const apiSources = apiUnit.sources || [];

    let linked = 0;
    for (const apiSource of apiSources) {
      // البحث أو إنشاء المصدر محلياً
      const localSource = await SourceService.findOrCreateBySlug(
        apiSource.slug || apiSource.name?.toLowerCase().replace(/\s+/g, '-') || '',
        apiSource.name || 'Unknown',
        apiSource.base_url || ''
      );

      // ربطه بالوحدة
      await MediaUnitSourceService.linkSource(unit.id, localSource.id, apiSource.priority || 1);
      linked++;
    }

    res.status(200).json({
      success: true,
      message: `تم مزامنة ${linked} مصدر للوحدة "${unit.name}"`,
      data: { linked, total_api_sources: apiSources.length },
    });
  } catch (error) {
    console.error('❌ خطأ في مزامنة المصادر:', error);
    res.status(500).json({ success: false, message: 'فشل مزامنة المصادر' });
  }
}

/**
 * GET /api/data/media-units/:slug/articles
 * جلب أخبار وحدة إعلامية محددة (من الداتابيس المحلي)
 */
export async function getMediaUnitArticles(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;

    const unit = await MediaUnitSourceService.getBySlug(slug);
    if (!unit) {
      res.status(404).json({ success: false, message: 'الوحدة الإعلامية غير موجودة' });
      return;
    }

    // جلب الأخبار المنشورة لهذه الوحدة
    let queryStr = `
      SELECT pi.id, pi.title, pi.content, pi.tags, pi.published_at, pi.is_active,
             rd.url, rd.image_url, rd.summary, rd.authors, rd.language, rd.pub_date,
             c.name as category_name, c.slug as category_slug,
             s.name as source_name, s.slug as source_slug,
             gs.name_ar as geo_name_ar, gs.slug as geo_slug
      FROM published_items pi
      JOIN raw_data rd ON pi.raw_data_id = rd.id
      LEFT JOIN categories c ON rd.category_id = c.id
      LEFT JOIN sources s ON rd.source_id = s.id
      LEFT JOIN geographic_scopes gs ON rd.geo_scope_id = gs.id
      WHERE pi.media_unit_id = $1 AND pi.is_active = true
    `;
    const params: any[] = [unit.id];
    let paramIdx = 2;

    if (category) {
      queryStr += ` AND c.slug = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    queryStr += ` ORDER BY pi.published_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);

    // عدد الإجمالي
    let countQuery = `
      SELECT COUNT(*) as total
      FROM published_items pi
      JOIN raw_data rd ON pi.raw_data_id = rd.id
      LEFT JOIN categories c ON rd.category_id = c.id
      WHERE pi.media_unit_id = $1 AND pi.is_active = true
    `;
    const countParams: any[] = [unit.id];
    if (category) {
      countQuery += ` AND c.slug = $2`;
      countParams.push(category);
    }
    const countResult = await query(countQuery, countParams);

    res.status(200).json({
      success: true,
      media_unit: { id: unit.id, name: unit.name, slug: unit.slug },
      total: parseInt(countResult.rows[0].total),
      count: result.rows.length,
      limit,
      offset,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب أخبار الوحدة:', error);
    res.status(500).json({ success: false, message: 'فشل جلب أخبار الوحدة' });
  }
}
