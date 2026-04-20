/**
 * Data Controller
 * متحكم البيانات (المصادر والأخبار والتصنيفات)
 */

import { Request, Response } from 'express';
import { SourceService, RawDataService, CategoryService } from '../../services/database/database.service';
import { query } from '../../config/database';

/**
 * الحصول على جميع وحدات الإعلام النشطة
 */
export async function getMediaUnits(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      'SELECT id, name, is_active FROM media_units WHERE is_active = true ORDER BY id'
    );
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب وحدات الإعلام:', error);
    res.status(500).json({ success: false, message: 'فشل جلب وحدات الإعلام' });
  }
}

/**
 * الحصول على الأخبار ذات المحتوى الناقص (أقل من حد معين)
 */
export async function getIncompleteArticles(req: Request, res: Response): Promise<void> {
  try {
    const maxLength = parseInt(req.query.max_length as string) || 150;
    const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : null;
    
    const params: any[] = [maxLength];
    let mediaUnitFilter = '';
    
    if (mediaUnitId && !isNaN(mediaUnitId)) {
      mediaUnitFilter = ` AND rd.media_unit_id = $${params.length + 1}`;
      params.push(mediaUnitId);
    }
    
    const query_str = `SELECT rd.id, rd.title, rd.content, rd.url, rd.image_url, rd.fetch_status, rd.fetched_at,
              rd.category_id, rd.media_unit_id, c.name as category_name, s.name as source_name, mu.name as media_unit_name
       FROM raw_data rd
       LEFT JOIN categories c ON rd.category_id = c.id
       LEFT JOIN sources s ON rd.source_id = s.id
       LEFT JOIN media_units mu ON rd.media_unit_id = mu.id
       WHERE LENGTH(rd.content) < $1 AND rd.fetch_status IN ('fetched', 'processed')
       AND NOT EXISTS (SELECT 1 FROM editorial_queue eq WHERE eq.raw_data_id = rd.id)${mediaUnitFilter}
       ORDER BY rd.fetched_at DESC`;
    
    const result = await query(query_str, params);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      maxLength,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الأخبار الناقصة:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الأخبار الناقصة' });
  }
}

/**
 * جلب خبر واحد بالـ ID مع تفاصيل المصدر والفئة
 */
export async function getArticleById(req: Request, res: Response): Promise<void> {
  try {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      res.status(400).json({ success: false, message: 'معرف الخبر غير صحيح' });
      return;
    }
    const result = await query(
      `SELECT rd.*, c.name as category_name, s.name as source_name
       FROM raw_data rd
       LEFT JOIN categories c ON rd.category_id = c.id
       LEFT JOIN sources s ON rd.source_id = s.id
       WHERE rd.id = $1`,
      [articleId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الخبر غير موجود' });
      return;
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في جلب الخبر:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الخبر' });
  }
}

/**
 * حذف خبر من قاعدة البيانات
 */
export async function deleteArticle(req: Request, res: Response): Promise<void> {
  try {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      res.status(400).json({ success: false, message: 'معرف الخبر غير صحيح' });
      return;
    }

    // حذف من editorial_queue أولاً (إن وجد)
    await query(
      `DELETE FROM editorial_queue WHERE raw_data_id = $1`,
      [articleId]
    );

    // ثم حذف من raw_data
    const result = await query(
      `DELETE FROM raw_data WHERE id = $1 RETURNING id`,
      [articleId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الخبر غير موجود' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف الخبر بنجاح',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('❌ خطأ في حذف الخبر:', error);
    res.status(500).json({ success: false, message: 'فشل حذف الخبر' });
  }
}

/**
 * تحديث محتوى خبر ناقص وإرساله لطابور التحرير (اختياري)
 */
export async function updateArticleContent(req: Request, res: Response): Promise<void> {
  try {
    const articleId = parseInt(req.params.id);
    const { content, title, imageUrl, sendToQueue = true } = req.body;

    if (isNaN(articleId)) {
      res.status(400).json({ success: false, message: 'معرف الخبر غير صحيح' });
      return;
    }
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'المحتوى مطلوب' });
      return;
    }

    // تحديد الحالة بناءً على sendToQueue
    const fetchStatus = sendToQueue ? 'processed' : 'fetched';

    // بناء قائمة التحديثات والمعاملات
    const updates: string[] = [];
    const params: any[] = [articleId];
    let paramIdx = 2;

    // إضافة المحتوى
    updates.push(`content = $${paramIdx}`);
    params.push(content.trim());
    paramIdx++;

    // إضافة حالة الجلب
    updates.push(`fetch_status = $${paramIdx}`);
    params.push(fetchStatus);
    paramIdx++;

    // إضافة العنوان إذا كان موجوداً
    if (title !== undefined) {
      updates.push(`title = $${paramIdx}`);
      params.push(title.trim());
      paramIdx++;
    }

    // إضافة رابط الصورة إذا كان موجوداً
    if (imageUrl !== undefined) {
      updates.push(`image_url = $${paramIdx}`);
      params.push(imageUrl || null);
      paramIdx++;
    }

    const result = await query(
      `UPDATE raw_data SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'الخبر غير موجود' });
      return;
    }

    const article = result.rows[0];

    // إضافة الخبر لطابور التحرير فقط إذا كان sendToQueue = true
    if (sendToQueue) {
      try {
        const mediaUnitsResult = await query(
          `SELECT id FROM media_units WHERE is_active = true`
        );

        for (const unit of mediaUnitsResult.rows) {
          // التحقق من عدم وجود الخبر في الطابور بالفعل
          const existsResult = await query(
            `SELECT id FROM editorial_queue WHERE raw_data_id = $1 AND media_unit_id = $2`,
            [articleId, unit.id]
          );

          if (existsResult.rows.length === 0) {
            await query(
              `INSERT INTO editorial_queue 
               (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
               VALUES ($1, $2, NULL, 'pending', NOW(), NOW())`,
              [unit.id, articleId]
            );
          }
        }
      } catch (queueError) {
        console.error('⚠️ تحذير: فشل إضافة الخبر لطابور التحرير:', queueError);
        // لا نرجع خطأ هنا لأن التحديث نجح
      }
    }

    const message = sendToQueue 
      ? 'تم تحديث الخبر وإرساله لستوديو التحرير'
      : 'تم حفظ التغييرات في الأخبار الغير مكتملة';

    res.status(200).json({
      success: true,
      message,
      data: article,
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث الخبر:', error);
    res.status(500).json({ success: false, message: 'فشل تحديث الخبر' });
  }
}

/**
 * الحصول على جميع المصادر
 */
export async function getAllSources(req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getAll();

    res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب المصادر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب المصادر',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على المصادر النشطة فقط
 */
export async function getActiveSources(req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getActive();

    res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب المصادر النشطة:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب المصادر النشطة',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على جميع الأخبار
 */
export async function getAllArticles(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const articles = await RawDataService.getAll();
    const paginated = articles.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      total: articles.length,
      count: paginated.length,
      limit,
      offset,
      data: paginated,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الأخبار:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب الأخبار',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على الأخبار حسب المصدر
 */
export async function getArticlesBySource(req: Request, res: Response): Promise<void> {
  try {
    const sourceId = parseInt(req.params.sourceId);

    if (isNaN(sourceId)) {
      res.status(400).json({
        success: false,
        message: 'معرف المصدر غير صحيح',
      });
      return;
    }

    const articles = await RawDataService.getBySourceId(sourceId);

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب أخبار المصدر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب أخبار المصدر',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على جميع التصنيفات
 */
export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await CategoryService.getAll();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب التصنيفات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب التصنيفات',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على الأخبار حسب التصنيف
 */
export async function getArticlesByCategory(req: Request, res: Response): Promise<void> {
  try {
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        message: 'معرف التصنيف غير صحيح',
      });
      return;
    }

    const allArticles = await RawDataService.getAll();
    const filtered = allArticles.filter((article: any) => article.category_id === categoryId);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب أخبار التصنيف:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب أخبار التصنيف',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على بيانات شاملة (مصادر + أخبار + تصنيفات)
 */
export async function getComprehensiveData(req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getAll();
    const articles = await RawDataService.getAll();
    const categories = await CategoryService.getAll();

    res.status(200).json({
      success: true,
      data: {
        sources: {
          count: sources.length,
          items: sources,
        },
        articles: {
          count: articles.length,
          items: articles,
        },
        categories: {
          count: categories.length,
          items: categories,
        },
      },
    });
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات الشاملة:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب البيانات الشاملة',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}

/**
 * الحصول على إحصائيات
 */
export async function getStatistics(req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getAll();
    const activeSources = await SourceService.getActive();
    const articles = await RawDataService.getAll();
    const categories = await CategoryService.getAll();

    // حساب الأخبار حسب التصنيف
    const articlesByCategory: Record<number, number> = {};
    articles.forEach((article: any) => {
      const catId = article.category_id;
      articlesByCategory[catId] = (articlesByCategory[catId] || 0) + 1;
    });

    // حساب الأخبار حسب المصدر
    const articlesBySource: Record<number, number> = {};
    articles.forEach((article: any) => {
      const srcId = article.source_id;
      articlesBySource[srcId] = (articlesBySource[srcId] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalSources: sources.length,
        activeSources: activeSources.length,
        totalArticles: articles.length,
        totalCategories: categories.length,
        articlesByCategory,
        articlesBySource,
      },
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب الإحصائيات',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    });
  }
}
