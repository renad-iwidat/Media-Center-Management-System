/**
 * Transcription Editorial Controller
 * إدارة الجهات الإعلامية وأنواع المخرجات ومنصات السوشال
 */

import { Request, Response } from 'express';
import { query } from '../../config/database';

// ══════════════════════════════════════════════════════════════════════════════
// Outlet Editorial Profiles (الجهات الإعلامية)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب جميع الجهات الإعلامية المفعّلة
 */
export async function getOutletProfiles(req: Request, res: Response) {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const sql = includeInactive
      ? 'SELECT * FROM outlet_editorial_profiles ORDER BY sort_order'
      : 'SELECT * FROM outlet_editorial_profiles WHERE is_active = true ORDER BY sort_order';

    const result = await query(sql);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب الجهات:', error);
    res.status(500).json({ success: false, error: 'فشل جلب الجهات الإعلامية' });
  }
}

/**
 * جلب جهة واحدة بالـ slug
 */
export async function getOutletProfileBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const result = await query(
      'SELECT * FROM outlet_editorial_profiles WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'الجهة غير موجودة' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في جلب الجهة:', error);
    res.status(500).json({ success: false, error: 'فشل جلب الجهة' });
  }
}

/**
 * إنشاء جهة إعلامية جديدة
 */
export async function createOutletProfile(req: Request, res: Response) {
  try {
    const {
      name, slug, identity, angle_approach, tone_language, avoid_rules,
      news_style, report_style, transcript_style, social_media_style,
      clips_criteria, media_unit_id, sort_order,
    } = req.body;

    if (!name || !slug || !identity || !angle_approach || !tone_language || !avoid_rules) {
      return res.status(400).json({
        success: false,
        error: 'الحقول المطلوبة: name, slug, identity, angle_approach, tone_language, avoid_rules',
      });
    }

    const result = await query(`
      INSERT INTO outlet_editorial_profiles 
        (name, slug, identity, angle_approach, tone_language, avoid_rules,
         news_style, report_style, transcript_style, social_media_style,
         clips_criteria, media_unit_id, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name, slug, identity, angle_approach, tone_language, avoid_rules,
      news_style || null, report_style || null, transcript_style || null,
      social_media_style || null, clips_criteria || null,
      media_unit_id || null, sort_order || 0,
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'الـ slug مستخدم مسبقًا' });
    }
    console.error('❌ خطأ في إنشاء الجهة:', error);
    res.status(500).json({ success: false, error: 'فشل إنشاء الجهة' });
  }
}

/**
 * تحديث جهة إعلامية
 */
export async function updateOutletProfile(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'identity', 'angle_approach', 'tone_language', 'avoid_rules',
      'news_style', 'report_style', 'transcript_style', 'social_media_style',
      'clips_criteria', 'media_unit_id', 'sort_order', 'is_active',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد حقول للتحديث' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(slug);

    const result = await query(
      `UPDATE outlet_editorial_profiles SET ${fields.join(', ')} WHERE slug = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'الجهة غير موجودة' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في تحديث الجهة:', error);
    res.status(500).json({ success: false, error: 'فشل تحديث الجهة' });
  }
}

/**
 * حذف جهة إعلامية
 */
export async function deleteOutletProfile(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const result = await query(
      'DELETE FROM outlet_editorial_profiles WHERE slug = $1 RETURNING id, name',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'الجهة غير موجودة' });
    }

    res.json({ success: true, message: 'تم حذف الجهة بنجاح', data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في حذف الجهة:', error);
    res.status(500).json({ success: false, error: 'فشل حذف الجهة' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Transcription Output Types (أنواع المخرجات)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب جميع أنواع المخرجات
 */
export async function getOutputTypes(_req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM transcription_output_types WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب أنواع المخرجات:', error);
    res.status(500).json({ success: false, error: 'فشل جلب أنواع المخرجات' });
  }
}

/**
 * إنشاء نوع مخرج جديد
 */
export async function createOutputType(req: Request, res: Response) {
  try {
    const { slug, name_ar, description, default_prompt_template, is_required, sort_order } = req.body;

    if (!slug || !name_ar) {
      return res.status(400).json({ success: false, error: 'الحقول المطلوبة: slug, name_ar' });
    }

    const result = await query(`
      INSERT INTO transcription_output_types (slug, name_ar, description, default_prompt_template, is_required, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [slug, name_ar, description || null, default_prompt_template || null, is_required || false, sort_order || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'الـ slug مستخدم مسبقًا' });
    }
    console.error('❌ خطأ في إنشاء نوع المخرج:', error);
    res.status(500).json({ success: false, error: 'فشل إنشاء نوع المخرج' });
  }
}

/**
 * تحديث نوع مخرج
 */
export async function updateOutputType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name_ar, description, default_prompt_template, is_required, sort_order, is_active } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name_ar !== undefined) { fields.push(`name_ar = $${paramCount++}`); values.push(name_ar); }
    if (description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(description); }
    if (default_prompt_template !== undefined) { fields.push(`default_prompt_template = $${paramCount++}`); values.push(default_prompt_template); }
    if (is_required !== undefined) { fields.push(`is_required = $${paramCount++}`); values.push(is_required); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${paramCount++}`); values.push(sort_order); }
    if (is_active !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(is_active); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد حقول للتحديث' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(parseInt(id));

    const result = await query(
      `UPDATE transcription_output_types SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'نوع المخرج غير موجود' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في تحديث نوع المخرج:', error);
    res.status(500).json({ success: false, error: 'فشل تحديث نوع المخرج' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Social Media Platforms (منصات السوشال)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب جميع منصات السوشال ميديا
 */
export async function getSocialPlatforms(_req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM social_media_platforms WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب منصات السوشال:', error);
    res.status(500).json({ success: false, error: 'فشل جلب منصات السوشال' });
  }
}

/**
 * إنشاء منصة سوشال جديدة
 */
export async function createSocialPlatform(req: Request, res: Response) {
  try {
    const { slug, name_ar, max_length, format_description, sort_order } = req.body;

    if (!slug || !name_ar) {
      return res.status(400).json({ success: false, error: 'الحقول المطلوبة: slug, name_ar' });
    }

    const result = await query(`
      INSERT INTO social_media_platforms (slug, name_ar, max_length, format_description, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [slug, name_ar, max_length || null, format_description || null, sort_order || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'الـ slug مستخدم مسبقًا' });
    }
    console.error('❌ خطأ في إنشاء المنصة:', error);
    res.status(500).json({ success: false, error: 'فشل إنشاء المنصة' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Outlet Output Config (تخصيص المخرجات حسب الجهة)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب تخصيصات المخرجات لجهة معينة
 */
export async function getOutletOutputConfig(req: Request, res: Response) {
  try {
    const { outletSlug } = req.params;

    const result = await query(`
      SELECT ooc.*, tot.slug as output_slug, tot.name_ar as output_name
      FROM outlet_output_config ooc
      JOIN outlet_editorial_profiles oep ON ooc.outlet_profile_id = oep.id
      JOIN transcription_output_types tot ON ooc.output_type_id = tot.id
      WHERE oep.slug = $1
      ORDER BY tot.sort_order
    `, [outletSlug]);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب تخصيصات المخرجات:', error);
    res.status(500).json({ success: false, error: 'فشل جلب التخصيصات' });
  }
}

/**
 * إنشاء أو تحديث تخصيص مخرج لجهة
 */
export async function upsertOutletOutputConfig(req: Request, res: Response) {
  try {
    const { outlet_profile_id, output_type_id, custom_prompt_override, style_notes, is_enabled } = req.body;

    if (!outlet_profile_id || !output_type_id) {
      return res.status(400).json({
        success: false,
        error: 'الحقول المطلوبة: outlet_profile_id, output_type_id',
      });
    }

    const result = await query(`
      INSERT INTO outlet_output_config (outlet_profile_id, output_type_id, custom_prompt_override, style_notes, is_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (outlet_profile_id, output_type_id) 
      DO UPDATE SET 
        custom_prompt_override = EXCLUDED.custom_prompt_override,
        style_notes = EXCLUDED.style_notes,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = NOW()
      RETURNING *
    `, [outlet_profile_id, output_type_id, custom_prompt_override || null, style_notes || null, is_enabled !== false]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في حفظ تخصيص المخرج:', error);
    res.status(500).json({ success: false, error: 'فشل حفظ التخصيص' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Angle Decision Rules (خريطة القرار)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب خريطة القرار
 */
export async function getAngleRules(_req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM angle_decision_rules WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب خريطة القرار:', error);
    res.status(500).json({ success: false, error: 'فشل جلب خريطة القرار' });
  }
}

/**
 * إنشاء قاعدة قرار جديدة
 */
export async function createAngleRule(req: Request, res: Response) {
  try {
    const { content_indicator, priority_action, recommended_outlet_ids, sort_order } = req.body;

    if (!content_indicator || !priority_action) {
      return res.status(400).json({
        success: false,
        error: 'الحقول المطلوبة: content_indicator, priority_action',
      });
    }

    const result = await query(`
      INSERT INTO angle_decision_rules (content_indicator, priority_action, recommended_outlet_ids, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [content_indicator, priority_action, JSON.stringify(recommended_outlet_ids || []), sort_order || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ خطأ في إنشاء قاعدة القرار:', error);
    res.status(500).json({ success: false, error: 'فشل إنشاء قاعدة القرار' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Quality Criteria (معايير الجودة)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * جلب معايير الجودة
 */
export async function getQualityCriteria(_req: Request, res: Response) {
  try {
    const result = await query(
      'SELECT * FROM quality_criteria WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('❌ خطأ في جلب معايير الجودة:', error);
    res.status(500).json({ success: false, error: 'فشل جلب معايير الجودة' });
  }
}
