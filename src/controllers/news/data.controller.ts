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
export async function getMediaUnits(_req: Request, res: Response): Promise<void> {
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
 * الحصول على الأخبار ذات المحتوى الناقص
 * الآن يجلب من editorial_queue بحالة 'incomplete'
 */
export async function getIncompleteArticles(_req: Request, res: Response): Promise<void> {
  try {
    const queryStr = `
      SELECT DISTINCT ON (rd.id)
        rd.id, rd.title, rd.content, rd.url, rd.image_url,
        rd.fetch_status, rd.fetched_at, rd.category_id,
        rd.is_incomplete,
        c.name  AS category_name,
        c.flow  AS category_flow,
        s.name  AS source_name
      FROM raw_data rd
      LEFT JOIN categories  c  ON rd.category_id = c.id
      LEFT JOIN sources     s  ON rd.source_id   = s.id
      WHERE rd.is_incomplete = true
        AND rd.fetch_status = 'processed'
      ORDER BY rd.id, rd.fetched_at DESC
    `;

    const result = await query(queryStr);
    res.status(200).json({
      success: true,
      count: result.rows.length,
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
      `SELECT rd.*, c.name as category_name, c.flow as category_flow, s.name as source_name
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

    // 1. حذف من published_items أولاً (يعتمد على editorial_queue)
    await query(
      `DELETE FROM published_items WHERE raw_data_id = $1`,
      [articleId]
    );

    // 2. حذف من editorial_queue
    await query(
      `DELETE FROM editorial_queue WHERE raw_data_id = $1`,
      [articleId]
    );

    // 3. حذف من raw_data
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
      data: { id: result.rows[0].id },
    });
  } catch (error) {
    console.error('❌ خطأ في حذف الخبر:', error);
    res.status(500).json({ success: false, message: 'فشل حذف الخبر' });
  }
}

/**
 * حذف جميع الأخبار الناقصة (is_incomplete = true)
 */
export async function deleteIncompleteArticles(_req: Request, res: Response): Promise<void> {
  try {
    // 1. حذف من published_items
    const publishedResult = await query(
      `DELETE FROM published_items 
       WHERE raw_data_id IN (SELECT id FROM raw_data WHERE is_incomplete = true)`
    );

    // 2. حذف من editorial_queue
    const queueResult = await query(
      `DELETE FROM editorial_queue 
       WHERE raw_data_id IN (SELECT id FROM raw_data WHERE is_incomplete = true)`
    );

    // 3. حذف من raw_data
    const rawResult = await query(
      `DELETE FROM raw_data WHERE is_incomplete = true RETURNING id`
    );

    res.status(200).json({
      success: true,
      message: `تم حذف ${rawResult.rows.length} خبر ناقص`,
      data: {
        deletedFromQueue: queueResult.rowCount,
        deletedFromPublished: publishedResult.rowCount,
        deletedFromRawData: rawResult.rowCount,
      },
    });
  } catch (error) {
    console.error('❌ خطأ في حذف الأخبار الناقصة:', error);
    res.status(500).json({ success: false, message: 'فشل حذف الأخبار الناقصة' });
  }
}

/**
 * حذف جميع الأخبار (حذف شامل)
 */
export async function deleteAllArticles(_req: Request, res: Response): Promise<void> {
  try {
    const publishedResult = await query(`DELETE FROM published_items`);
    const queueResult = await query(`DELETE FROM editorial_queue`);
    const rawResult = await query(`DELETE FROM raw_data RETURNING id`);

    res.status(200).json({
      success: true,
      message: `تم حذف ${rawResult.rows.length} خبر`,
      data: {
        deletedFromQueue: queueResult.rowCount,
        deletedFromPublished: publishedResult.rowCount,
        deletedFromRawData: rawResult.rowCount,
      },
    });
  } catch (error) {
    console.error('❌ خطأ في حذف جميع الأخبار:', error);
    res.status(500).json({ success: false, message: 'فشل حذف جميع الأخبار' });
  }
}


/**
 * تحديث محتوى خبر ناقص وتوجيهه حسب نوع الفلو
 * 
 * الفلو الجديد — الأخبار الناقصة موجودة أصلاً في editorial_queue بحالة 'incomplete':
 * - أوتوماتيكي → incomplete → approved تلقائياً → published_items
 * - تحريري → incomplete → in_review → (المحرر يراجع) → approved → published_items
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

    // بناء قائمة التحديثات
    const updates: string[] = [];
    const params: any[] = [articleId];
    let paramIdx = 2;

    updates.push(`content = $${paramIdx}`);
    params.push(content.trim());
    paramIdx++;

    updates.push(`is_incomplete = $${paramIdx}`);
    params.push(false);
    paramIdx++;

    if (title !== undefined) {
      updates.push(`title = $${paramIdx}`);
      params.push(title.trim());
      paramIdx++;
    }

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

    // إذا المستخدم اختار عدم الإرسال (حفظ فقط)
    if (!sendToQueue) {
      res.status(200).json({
        success: true,
        message: 'تم حفظ التغييرات في الأخبار الغير مكتملة',
        data: article,
      });
      return;
    }

    // تحديد نوع الفلو
    let flowType: 'automated' | 'editorial' = 'editorial';

    if (article.category_id) {
      const categoryResult = await query(
        `SELECT flow FROM categories WHERE id = $1`,
        [article.category_id]
      );
      if (categoryResult.rows.length > 0) {
        flowType = categoryResult.rows[0].flow || 'editorial';
      }
    }

    console.log(`📰 الخبر ${articleId} — التصنيف: ${article.category_id} — الفلو: ${flowType}`);

    // جلب سجلات الطابور الموجودة لهذا الخبر (بحالة incomplete)
    const queueRecords = await query(
      `SELECT eq.id, eq.media_unit_id, mu.name as media_unit_name
       FROM editorial_queue eq
       JOIN media_units mu ON eq.media_unit_id = mu.id
       WHERE eq.raw_data_id = $1 AND eq.status = 'incomplete'`,
      [articleId]
    );

    // إذا ما في سجلات incomplete، ننشئ سجلات جديدة
    if (queueRecords.rows.length === 0) {
      const mediaUnitsResult = await query(
        `SELECT id, name FROM media_units WHERE is_active = true`
      );
      for (const unit of mediaUnitsResult.rows) {
        const existsResult = await query(
          `SELECT id FROM editorial_queue WHERE raw_data_id = $1 AND media_unit_id = $2`,
          [articleId, unit.id]
        );
        if (existsResult.rows.length === 0) {
          const insertResult = await query(
            `INSERT INTO editorial_queue
             (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
             VALUES ($1, $2, NULL, 'pending', NOW(), NOW())
             RETURNING id`,
            [unit.id, articleId]
          );
          queueRecords.rows.push({
            id: insertResult.rows[0].id,
            media_unit_id: unit.id,
            media_unit_name: unit.name,
          });
        }
      }
    }

    if (flowType === 'automated') {
      // أوتوماتيكي: incomplete → approved → published_items
      console.log(`⚡ الخبر ${articleId} — أوتوماتيكي → auto-approve ونشر`);

      for (const record of queueRecords.rows) {
        try {
          await query(
            `UPDATE editorial_queue SET status = 'approved', updated_at = NOW() WHERE id = $1`,
            [record.id]
          );

          const existsResult = await query(
            `SELECT id FROM published_items WHERE raw_data_id = $1 AND media_unit_id = $2`,
            [articleId, record.media_unit_id]
          );

          if (existsResult.rows.length === 0) {
            await query(
              `INSERT INTO published_items 
               (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
               VALUES ($1, $2, $3, 1, $4, $5, $6, true, NOW())`,
              [record.media_unit_id, articleId, record.id, article.title, content.trim(), article.tags || []]
            );
            console.log(`   ✅ نشر في ${record.media_unit_name}`);
          }
        } catch (publishError) {
          console.error(`   ❌ خطأ في النشر في ${record.media_unit_name}:`, publishError);
        }
      }

      await query(
        `UPDATE raw_data SET fetch_status = 'published' WHERE id = $1`,
        [articleId]
      );

      res.status(200).json({
        success: true,
        message: 'تم إكمال الخبر ونشره مباشرة (أوتوماتيكي)',
        data: article,
        flowType: 'automated',
        action: 'published',
      });

    } else {
      // تحريري: incomplete → in_review (ينتظر المحرر)
      console.log(`📝 الخبر ${articleId} — تحريري → in_review`);

      await query(
        `UPDATE editorial_queue SET status = 'in_review', updated_at = NOW()
         WHERE raw_data_id = $1 AND status = 'incomplete'`,
        [articleId]
      );

      await query(
        `UPDATE raw_data SET fetch_status = 'processed' WHERE id = $1`,
        [articleId]
      );

      res.status(200).json({
        success: true,
        message: 'تم إكمال الخبر وإرساله لستوديو التحرير',
        data: article,
        flowType: 'editorial',
        action: 'queued',
      });
    }

  } catch (error) {
    console.error('❌ خطأ في تحديث الخبر:', error);
    res.status(500).json({ success: false, message: 'فشل تحديث الخبر' });
  }
}

/**
 * الحصول على جميع المصادر
 */
export async function getAllSources(_req: Request, res: Response): Promise<void> {
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
export async function getActiveSources(_req: Request, res: Response): Promise<void> {
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
      res.status(400).json({ success: false, message: 'معرف المصدر غير صحيح' });
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
export async function getAllCategories(_req: Request, res: Response): Promise<void> {
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
      res.status(400).json({ success: false, message: 'معرف التصنيف غير صحيح' });
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
export async function getComprehensiveData(_req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getAll();
    const articles = await RawDataService.getAll();
    const categories = await CategoryService.getAll();

    res.status(200).json({
      success: true,
      data: {
        sources:    { count: sources.length,    items: sources },
        articles:   { count: articles.length,   items: articles },
        categories: { count: categories.length, items: categories },
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
export async function getStatistics(_req: Request, res: Response): Promise<void> {
  try {
    const sources = await SourceService.getAll();
    const activeSources = await SourceService.getActive();
    const articles = await RawDataService.getAll();
    const categories = await CategoryService.getAll();

    const articlesByCategory: Record<number, number> = {};
    articles.forEach((article: any) => {
      const catId = article.category_id;
      articlesByCategory[catId] = (articlesByCategory[catId] || 0) + 1;
    });

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
