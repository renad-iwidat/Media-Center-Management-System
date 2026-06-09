/**
 * Auto-Publish Service
 * خدمة النشر التلقائي على المواقع الخارجية
 *
 * كل وحدة إعلامية (media_unit) ممكن يكون عندها هدف نشر واحد أو أكثر
 * (auto_publish_targets) — مثلاً: وحدة "هنا غزة" تنشر على موقع hgaza.nn.ps
 *
 * الفلو:
 * 1. الخبر ينشر محلياً (published_items) لوحدة إعلامية معينة
 * 2. هالسيرفس يفحص إذا الوحدة عندها أهداف نشر خارجية مفعّلة
 * 3. ينشر الخبر على كل هدف مفعّل لم يُنشر عليه بعد
 */

import { query } from '../../config/database';
import { SystemSettingsService } from '../database/system-settings.service';
import { callOpenAIChatAPI } from '../ai-hub/ai-call.service';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface AutoPublishTarget {
  id: number;
  media_unit_id: number;
  name: string;
  api_url: string;
  api_token: string;
  auth_type: 'bearer' | 'token';            // نوع المصادقة
  default_category_id: number;
  category_mappings: Record<string, number>; // { "local_id": external_id }
  default_auto_publish: boolean;             // نشر مباشر أم مسودة (للمواقع التي تدعمه)
  default_pin: number;                       // قيمة pin الافتراضية (0-5)
  categories_api_url: string | null;         // رابط API التصنيفات من الموقع الخارجي
  publish_mode: 'automated' | 'manual';      // automated = سكيدولر / manual = المحرر فقط
  manual_enabled: boolean;                   // تفعيل/إيقاف النشر اليدوي من قِبل المحرر
  auto_enabled: boolean;                     // تفعيل/إيقاف النشر التلقائي بالسكيدولر
  is_enabled: boolean;                       // محتفظ به للتوافق مع الكود القديم (= manual_enabled || auto_enabled)
  created_at: string;
  updated_at: string;
  media_unit_name?: string;
}

export interface AutoPublishArticle {
  id: number;              // raw_data_id
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  category_id: number | null;
  category_slug: string | null;
  media_unit_id: number;
}

export interface AutoPublishResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: {
    articleId: number;
    targetId: number;
    targetName: string;
    title: string;
    status: 'success' | 'failed' | 'skipped';
    responseCode?: number;
    error?: string;
  }[];
}

// ── Category Mapping ────────────────────────────────────────────────────────
// التصنيفات الآن محفوظة في الداتابيس (category_mappings JSONB) لكل هدف
// هذا fallback فقط للأهداف القديمة التي ليس لها mappings في الداتابيس

const FALLBACK_HGAZA_CATEGORY: Record<number, number> = {
  1:  1,   // محلي → الأخبار المحلية
  2:  4,   // دولي → الأخبار الدولية
  3:  6,   // اقتصاد → الاقتصاد
  4:  7,   // رياضة → الرياضة
  5:  2,   // صحة → الصحة
  6:  8,   // علوم وتكنولوجيا → تكنولوجيا
  7:  9,   // فن و ثقافة → الثقافة
  9:  10,  // بيئة → اجتماعي
  10: 13,  // غذاء → أخبار عامة
  11: 5,   // سياسي → السياسة
};

/**
 * تحديد التصنيف الخارجي من mappings الداتابيس
 * إذا ما في mapping → يرجع default_category_id
 */
function resolveExternalCategory(
  localCategoryId: number | null,
  target: AutoPublishTarget
): number {
  if (!localCategoryId) return target.default_category_id;

  // من الداتابيس أولاً
  const dbMappings = target.category_mappings || {};
  const dbMapped = dbMappings[String(localCategoryId)];
  if (dbMapped) return dbMapped;

  // fallback: للأهداف القديمة التي ليس لها mappings
  if (target.api_url.includes('hgaza.nn.ps')) {
    return FALLBACK_HGAZA_CATEGORY[localCategoryId] || target.default_category_id;
  }

  return target.default_category_id;
}

// ── AI Tag Generation ────────────────────────────────────────────────────────

/**
 * توليد تاجز (كلمات مفتاحية) بالذكاء الاصطناعي من العنوان والمحتوى
 * وتخزينها في قاعدة البيانات
 */
async function generateAndSaveTags(articleId: number, title: string, content: string): Promise<string[]> {
  try {
    const prompt = `أنت محرر SEO محترف. استخرج 5-8 كلمات مفتاحية (keywords) من الخبر التالي.
القواعد:
- كل كلمة مفتاحية يجب أن تكون كلمة واحدة فقط (بدون مسافات)
- بالعربية
- ذات صلة بالمحتوى
- مناسبة لمحركات البحث

العنوان: ${title}
المحتوى: ${content.substring(0, 500)}

أرجع الكلمات المفتاحية فقط مفصولة بفواصل، بدون ترقيم أو شرح. كل كلمة يجب أن تكون مفردة.
مثال: غزة,صحة,مستشفى,طوارئ,جرحى,فلسطين,علاج,إصابات`;

    const aiResponse = await callOpenAIChatAPI(prompt);
    
    // تنظيف الرد وتحويله لمصفوفة
    const tags = aiResponse
      .split(/[,،\n]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length < 50)
      .slice(0, 8);

    if (tags.length > 0) {
      // حفظ التاجز في قاعدة البيانات
      await query(
        `UPDATE raw_data SET tags = $1 WHERE id = $2`,
        [tags, articleId]
      );
      console.log(`   🏷️ AI Tags generated and saved: [${tags.join(', ')}]`);
    }

    return tags;
  } catch (err) {
    console.log(`   ⚠️ فشل توليد التاجز بالـ AI: ${err instanceof Error ? err.message : 'unknown'}`);
    return [];
  }
}

// ── Service Class ───────────────────────────────────────────────────────────

class AutoPublishService {

  // ════════════════════════════════════════════════════════════════════════════
  // إدارة الأهداف (Targets CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * جلب جميع أهداف النشر
   */
  async getAllTargets(): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       ORDER BY apt.media_unit_id, apt.name`
    );
    return result.rows;
  }

  /**
   * جلب أهداف النشر لوحدة إعلامية معينة
   */
  async getTargetsByMediaUnit(mediaUnitId: number): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.media_unit_id = $1
       ORDER BY apt.name`,
      [mediaUnitId]
    );
    return result.rows;
  }

  /**
   * جلب هدف واحد بالـ ID
   */
  async getTargetById(targetId: number): Promise<AutoPublishTarget | null> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.id = $1`,
      [targetId]
    );
    return result.rows[0] || null;
  }

  /**
   * إنشاء هدف نشر جديد
   */
  async createTarget(data: {
    media_unit_id: number;
    name: string;
    api_url: string;
    api_token: string;
    auth_type?: 'bearer' | 'token';
    default_category_id?: number;
    category_mappings?: Record<string, number>;
    default_auto_publish?: boolean;
    default_pin?: number;
    categories_api_url?: string;
    publish_mode?: 'automated' | 'manual';
    manual_enabled?: boolean;
    auto_enabled?: boolean;
    is_enabled?: boolean;
  }): Promise<AutoPublishTarget> {
    const manualEnabled = data.manual_enabled ?? data.is_enabled ?? false;
    const autoEnabled   = data.auto_enabled   ?? data.is_enabled ?? false;
    const result = await query(
      `INSERT INTO auto_publish_targets
         (media_unit_id, name, api_url, api_token, auth_type,
          default_category_id, category_mappings, default_auto_publish, default_pin,
          categories_api_url, publish_mode, manual_enabled, auto_enabled, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.media_unit_id,
        data.name,
        data.api_url,
        data.api_token,
        data.auth_type || 'bearer',
        data.default_category_id || 1,
        JSON.stringify(data.category_mappings || {}),
        data.default_auto_publish ?? true,
        data.default_pin ?? 0,
        data.categories_api_url || null,
        data.publish_mode || 'automated',
        manualEnabled,
        autoEnabled,
        manualEnabled || autoEnabled,  // is_enabled = OR من الاثنين
      ]
    );
    return result.rows[0];
  }

  /**
   * تحديث هدف نشر
   */
  async updateTarget(targetId: number, data: Partial<{
    name: string;
    api_url: string;
    api_token: string;
    auth_type: 'bearer' | 'token';
    default_category_id: number;
    category_mappings: Record<string, number>;
    default_auto_publish: boolean;
    default_pin: number;
    categories_api_url: string;
    publish_mode: 'automated' | 'manual';
    manual_enabled: boolean;
    auto_enabled: boolean;
    is_enabled: boolean;
  }>): Promise<AutoPublishTarget | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined)               { fields.push(`name = $${paramIndex++}`);               values.push(data.name); }
    if (data.api_url !== undefined)            { fields.push(`api_url = $${paramIndex++}`);            values.push(data.api_url); }
    if (data.api_token !== undefined)          { fields.push(`api_token = $${paramIndex++}`);          values.push(data.api_token); }
    if (data.auth_type !== undefined)          { fields.push(`auth_type = $${paramIndex++}`);          values.push(data.auth_type); }
    if (data.default_category_id !== undefined){ fields.push(`default_category_id = $${paramIndex++}`);values.push(data.default_category_id); }
    if (data.category_mappings !== undefined)  { fields.push(`category_mappings = $${paramIndex++}`); values.push(JSON.stringify(data.category_mappings)); }
    if (data.default_auto_publish !== undefined){ fields.push(`default_auto_publish = $${paramIndex++}`); values.push(data.default_auto_publish); }
    if (data.default_pin !== undefined)        { fields.push(`default_pin = $${paramIndex++}`);        values.push(data.default_pin); }
    if (data.categories_api_url !== undefined) { fields.push(`categories_api_url = $${paramIndex++}`); values.push(data.categories_api_url); }
    if (data.publish_mode !== undefined)       { fields.push(`publish_mode = $${paramIndex++}`);       values.push(data.publish_mode); }
    if (data.manual_enabled !== undefined)     { fields.push(`manual_enabled = $${paramIndex++}`);     values.push(data.manual_enabled); }
    if (data.auto_enabled !== undefined)       { fields.push(`auto_enabled = $${paramIndex++}`);       values.push(data.auto_enabled); }

    // is_enabled = manual_enabled OR auto_enabled (يُحدَّث تلقائياً)
    if (data.manual_enabled !== undefined || data.auto_enabled !== undefined) {
      fields.push(`is_enabled = (
        COALESCE($${paramIndex}::boolean, manual_enabled) OR COALESCE($${paramIndex + 1}::boolean, auto_enabled)
      )`);
      values.push(data.manual_enabled !== undefined ? data.manual_enabled : null);
      values.push(data.auto_enabled !== undefined ? data.auto_enabled : null);
      paramIndex += 2;
    } else if (data.is_enabled !== undefined) {
      fields.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(targetId);

    const result = await query(
      `UPDATE auto_publish_targets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * حذف هدف نشر
   */
  async deleteTarget(targetId: number): Promise<boolean> {
    // حذف السجلات المرتبطة أولاً
    await query('DELETE FROM auto_publish_log WHERE target_id = $1', [targetId]);
    const result = await query('DELETE FROM auto_publish_targets WHERE id = $1', [targetId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * تفعيل/إيقاف هدف نشر (is_enabled — للتوافق مع الكود القديم)
   * @deprecated استخدم toggleManualEnabled أو toggleAutoEnabled بدلاً منه
   */
  async toggleTarget(targetId: number, enabled: boolean): Promise<AutoPublishTarget | null> {
    return this.updateTarget(targetId, { manual_enabled: enabled, auto_enabled: enabled });
  }

  /**
   * تفعيل/إيقاف النشر اليدوي لهدف معين
   * يتحكم في قدرة المحرر على النشر اليدوي من واجهة التحرير
   */
  async toggleManualEnabled(targetId: number, enabled: boolean): Promise<AutoPublishTarget | null> {
    return this.updateTarget(targetId, { manual_enabled: enabled });
  }

  /**
   * تفعيل/إيقاف النشر التلقائي لهدف معين
   * يتحكم في السكيدولر — لا يؤثر على النشر اليدوي
   */
  async toggleAutoEnabled(targetId: number, enabled: boolean): Promise<AutoPublishTarget | null> {
    return this.updateTarget(targetId, { auto_enabled: enabled });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // النشر التلقائي
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * جلب الأخبار المنشورة محلياً لوحدة إعلامية معينة
   * التي لم تُنشر بعد على هدف معين
   * 
   * ⚠️ قواعد النشر التلقائي:
   * - الأخبار الأوتوماتيكية (حسب CATEGORY_FLOW_MAP) → تنشر تلقائياً
   * - الأخبار التحريرية (محلي، سياسي، دولي) → المحرر ينشرها يدوياً من استديو التحرير
   */
  async getUnpublishedForTarget(targetId: number, mediaUnitId: number, limit: number = 20): Promise<AutoPublishArticle[]> {
    // التصنيفات الأوتوماتيكية — من categories.flow = 'automated' (مستقر بالـ slug)
    const result = await query(
      `SELECT rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.category_id,
              c.slug as category_slug, pi.media_unit_id
       FROM published_items pi
       JOIN raw_data rd ON rd.id = pi.raw_data_id
       JOIN categories c ON c.id = rd.category_id
       WHERE pi.media_unit_id = $1
         AND pi.is_active = true
         AND c.flow = 'automated'
         AND rd.id NOT IN (
           SELECT raw_data_id FROM auto_publish_log 
           WHERE target_id = $2 AND status = 'success'
         )
       ORDER BY pi.published_at DESC
       LIMIT $3`,
      [mediaUnitId, targetId, limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: row.media_unit_id,
    }));
  }

  /**
   * نشر خبر واحد على هدف معين
   * overrides: إعدادات يختارها المحرر (تصنيف، pin، auto_publish) — تأتي من dialog الفرونت
   */
  async publishOneToTarget(
    article: AutoPublishArticle,
    target: AutoPublishTarget,
    overrides?: {
      category_id?: number;       // التصنيف الخارجي الذي اختاره المحرر
      auto_publish?: boolean;     // نشر فوري أم مسودة
      pin?: number;               // 0-5
    }
  ): Promise<{ success: boolean; responseCode?: number; error?: string; responseBody?: string; externalUrl?: string; externalId?: number }> {
    try {
      // تحديد التصنيف الخارجي — overrides من المحرر أولاً ثم mapping الداتابيس
      const externalCategoryId = overrides?.category_id !== undefined
        ? overrides.category_id
        : resolveExternalCategory(article.category_id, target);

      // قيم auto_publish و pin — overrides أولاً ثم إعدادات الهدف
      const autoPublish = overrides?.auto_publish !== undefined
        ? overrides.auto_publish
        : target.default_auto_publish;

      const pinValue = overrides?.pin !== undefined
        ? overrides.pin
        : target.default_pin;

      // تجهيز الـ keywords — يجب أن يكون string مفصول بفواصل
      // ⚠️ Django API تبع النجاح وهنا غزة يعالج keywords بطريقة خاصة:
      // يعمل split بالفاصلة ثم add() — لذلك نرسل string بسيط بدون quotes
      let tagsString: string;
      const rawTags = article.tags as any;
      if (Array.isArray(rawTags) && rawTags.length > 0) {
        tagsString = rawTags.map((t: any) => String(t).trim()).filter((t: string) => t.length > 0).join(',');
      } else if (typeof rawTags === 'string' && rawTags.trim()) {
        let cleaned = rawTags.trim();
        if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
          cleaned = cleaned.replace(/[\[\]{}"']/g, '');
        }
        tagsString = cleaned;
      } else {
        // لا توجد تاجز → توليد بالذكاء الاصطناعي وتخزينها
        console.log(`   🤖 لا توجد تاجز — جاري التوليد بالـ AI...`);
        const aiTags = await generateAndSaveTags(article.id, article.title, article.content);
        if (aiTags.length > 0) {
          tagsString = aiTags.join(',');
        } else {
          tagsString = article.title.split(/\s+/).slice(0, 5).join(',');
        }
      }
      if (!tagsString || tagsString.trim().length === 0) {
        tagsString = article.title.split(/\s+/).slice(0, 5).join(',');
      }

      console.log(`   📡 Sending to: ${target.api_url}`);
      console.log(`   📦 Payload: title="${article.title.substring(0, 50)}..." cat=${externalCategoryId} auto_publish=${autoPublish} pin=${pinValue} auth=${target.auth_type}`);
      console.log(`   🏷️ Keywords: "${tagsString}" (type: ${typeof tagsString}, from tags: ${JSON.stringify(article.tags)})`);

      // تحميل الصورة وتحويلها لـ Blob (ملف) للرفع
      let imageBlob: Blob | null = null;
      let imageName = 'image.jpg';
      if (article.image_url) {
        try {
          const imgResponse = await fetch(article.image_url, { signal: AbortSignal.timeout(15000) });
          if (imgResponse.ok) {
            const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
            const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
            imageBlob = new Blob([imgBuffer], { type: contentType });
            // استخراج اسم الملف من الـ URL
            const urlPath = new URL(article.image_url).pathname;
            const fileName = urlPath.split('/').pop();
            if (fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
              imageName = fileName;
            } else {
              const ext = contentType.split('/')[1] || 'jpg';
              imageName = `image.${ext}`;
            }
          } else {
            console.log(`   ⚠️ فشل تحميل الصورة (${imgResponse.status}), سيتم النشر بدون صورة`);
          }
        } catch (imgErr) {
          console.log(`   ⚠️ خطأ في تحميل الصورة: ${imgErr instanceof Error ? imgErr.message : 'unknown'}, سيتم النشر بدون صورة`);
        }
      }

      // Authorization header حسب auth_type من الداتابيس
      const authHeader = target.auth_type === 'token'
        ? `Token ${target.api_token}`
        : `Bearer ${target.api_token}`;

      // نوع الموقع للحقول الإضافية
      const supportsAutoPublish = target.auth_type === 'token' || target.api_url.includes('nn.najah.edu');

      let response!: Response;
      let responseBody = '';
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
        const CRLF = '\r\n';
        
        // بناء multipart/form-data يدوياً مثل curl بالضبط
        const parts: (string | Buffer)[] = [];
        
        const addField = (name: string, value: string) => {
          parts.push(
            `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
            `${value}${CRLF}`
          );
        };
        
        addField('title', article.title);
        addField('content', article.content);
        addField('category_id', String(externalCategoryId));
        // keywords: حقل واحد بقيمة مفصولة بفواصل — مثل curl: -F "keywords=test,api"
        // ملاحظة: backend النجاح فيه bug يحوّلها list — بانتظار إصلاحهم
        addField('keywords', tagsString);

        // المواقع التي تدعم auto_publish و pin (مثل موقع النجاح)
        if (supportsAutoPublish) {
          addField('auto_publish', autoPublish ? 'true' : 'false');
          addField('pin', String(pinValue));
          addField('image_caption', article.title.substring(0, 100));
          addField('content_format', 'html');
        }

        // إرسال الصورة كـ binary part
        if (imageBlob) {
          const imgBuffer = Buffer.from(await imageBlob.arrayBuffer());
          const contentType = imageBlob.type || 'image/jpeg';
          
          if (target.auth_type === 'token') {
            // موقع النجاح يتوقع ملف image
            parts.push(
              `--${boundary}${CRLF}` +
              `Content-Disposition: form-data; name="image"; filename="${imageName}"${CRLF}` +
              `Content-Type: ${contentType}${CRLF}${CRLF}`
            );
            parts.push(imgBuffer);
            parts.push(CRLF);
          } else {
            // المواقع الأخرى (مثل هنا غزة) تقبل base64
            const imageBase64 = `data:${contentType};base64,${imgBuffer.toString('base64')}`;
            addField('image_base64', imageBase64);
          }
        }

        // إغلاق الـ boundary
        parts.push(`--${boundary}--${CRLF}`);

        // بناء الـ body كـ Buffer
        const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p, 'utf-8') : p);
        const bodyBuffer = Buffer.concat(bodyParts);

        response = await fetch(target.api_url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': authHeader,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body: bodyBuffer,
        });

        responseBody = await response.text();

        if (response.status !== 500 || attempt === maxRetries) break;

        const waitTime = (attempt + 1) * 5000;
        console.log(`   🔄 Retry ${attempt + 1}/${maxRetries} after ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      console.log(`   📋 Response [${response.status}]: ${responseBody.substring(0, 300)}`);

      if (response.ok) {
        let externalId: number | undefined;
        let externalUrl: string | undefined;
        try {
          const parsed = JSON.parse(responseBody);
          externalId = parsed?.data?.id || parsed?.id;
          if (parsed?.data?.url) externalUrl = parsed.data.url;
          else if (parsed?.url) externalUrl = parsed.url;
          // fallback slug
          if (!externalUrl && article.title) {
            const baseUrl = target.api_url.replace(/\/api\/.*$/, '');
            const slug = article.title
              .trim()
              .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            externalUrl = `${baseUrl}/article/${encodeURIComponent(slug)}`;
          }
        } catch { /* تجاهل */ }

        console.log(`   🔗 External URL: ${externalUrl || '(لم يُرجع رابط)'}`);

        await this.logPublish(target.id, article.id, 'success', response.status, responseBody, undefined, externalUrl, externalId);
        await query(
          `UPDATE raw_data SET publish_status = 'published_external'
           WHERE id = $1 AND publish_status NOT IN ('archived')`,
          [article.id]
        );

        return { success: true, responseCode: response.status, responseBody, externalUrl, externalId };
      } else {
        await this.logPublish(target.id, article.id, 'failed', response.status, responseBody, `HTTP ${response.status}`);
        return { success: false, responseCode: response.status, error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logPublish(target.id, article.id, 'failed', undefined, undefined, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * تسجيل عملية النشر في الـ log
   */
  private async logPublish(
    targetId: number,
    rawDataId: number,
    status: 'success' | 'failed' | 'pending',
    responseCode?: number,
    responseBody?: string,
    errorMessage?: string,
    externalUrl?: string,
    externalId?: number
  ): Promise<void> {
    try {
      const existing = await query(
        'SELECT id, retry_count FROM auto_publish_log WHERE target_id = $1 AND raw_data_id = $2 ORDER BY created_at DESC LIMIT 1',
        [targetId, rawDataId]
      );

      if (existing.rows.length > 0 && status === 'failed') {
        await query(
          `UPDATE auto_publish_log 
           SET status = $1, response_code = $2, response_body = $3, 
               error_message = $4, retry_count = retry_count + 1, updated_at = NOW()
           WHERE id = $5`,
          [status, responseCode || null, responseBody || null, errorMessage || null, existing.rows[0].id]
        );
      } else {
        await query(
          `INSERT INTO auto_publish_log (target_id, raw_data_id, status, response_code, response_body, error_message, external_url, external_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [targetId, rawDataId, status, responseCode || null, responseBody || null, errorMessage || null, externalUrl || null, externalId || null]
        );
      }
    } catch (err) {
      console.error('❌ خطأ في تسجيل عملية النشر:', err);
    }
  }

  /**
   * نشر جميع الأخبار المعتمدة على جميع الأهداف المفعّلة
   * هذه الدالة تُستدعى من الـ scheduler
   */
  async publishAll(): Promise<AutoPublishResult> {
    // فحص الـ master switch
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) {
      console.log('⏸️  النشر التلقائي متوقف (auto_publish_enabled = false)');
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    // جلب جميع الأهداف المفعّلة للنشر التلقائي فقط (auto_enabled = true)
    const targetsResult = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.auto_enabled = true`
    );
    const enabledTargets: AutoPublishTarget[] = targetsResult.rows;

    if (enabledTargets.length === 0) {
      console.log('⚠️  لا يوجد أهداف نشر مفعّلة');
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    const result: AutoPublishResult = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    // لكل هدف مفعّل — جلب الأخبار غير المنشورة ونشرها
    for (const target of enabledTargets) {
      console.log(`\n📤 النشر على: ${target.name} (${target.media_unit_name})`);

      const articles = await this.getUnpublishedForTarget(target.id, target.media_unit_id, 20);

      if (articles.length === 0) {
        console.log(`   ✅ لا يوجد أخبار جديدة للنشر`);
        continue;
      }

      console.log(`   📰 ${articles.length} خبر جاهز للنشر`);

      for (const article of articles) {
        result.total++;

        // تخطي المقالات بدون عنوان أو محتوى
        if (!article.title || !article.content) {
          result.skipped++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title || '(بدون عنوان)',
            status: 'skipped',
            error: 'عنوان أو محتوى فارغ',
          });
          continue;
        }

        const publishResult = await this.publishOneToTarget(article, target);

        if (publishResult.success) {
          result.success++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title,
            status: 'success',
            responseCode: publishResult.responseCode,
          });
          console.log(`   ✅ ${article.title.substring(0, 50)}...`);
        } else {
          result.failed++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title,
            status: 'failed',
            responseCode: publishResult.responseCode,
            error: publishResult.error,
          });
          console.log(`   ❌ ${article.title.substring(0, 50)}... — ${publishResult.error}`);
        }

        // تأخير بين كل طلب (5 ثواني) لتجنب rate limiting على السيرفر الخارجي
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (result.total > 0) {
      console.log(`\n📊 نتيجة النشر التلقائي: ✅ ${result.success} | ❌ ${result.failed} | ⏭️ ${result.skipped}`);
    }

    return result;
  }

  /**
   * إعادة محاولة نشر المقالات الفاشلة (حد أقصى 3 محاولات)
   */
  async retryFailed(): Promise<AutoPublishResult> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) {
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    // جلب المقالات الفاشلة مع أهدافها (كل أعمدة الهدف)
    const failedResult = await query(
      `SELECT apl.target_id, apl.raw_data_id,
              rd.title, rd.content, rd.image_url, rd.tags, rd.category_id,
              c.slug as category_slug,
              apt.media_unit_id, apt.name as target_name,
              apt.api_url, apt.api_token, apt.auth_type,
              apt.default_category_id, apt.category_mappings,
              apt.default_auto_publish, apt.default_pin, apt.categories_api_url
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       JOIN raw_data rd ON rd.id = apl.raw_data_id
       LEFT JOIN categories c ON c.id = rd.category_id
       WHERE apl.status = 'failed' 
         AND apl.retry_count < 3
         AND apt.auto_enabled = true
       ORDER BY apl.updated_at ASC
       LIMIT 10`
    );

    if (failedResult.rows.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    console.log(`🔄 إعادة محاولة نشر ${failedResult.rows.length} خبر فاشل...`);

    const result: AutoPublishResult = {
      total: failedResult.rows.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    for (const row of failedResult.rows) {
      const article: AutoPublishArticle = {
        id: row.raw_data_id,
        title: row.title,
        content: row.content,
        image_url: row.image_url || null,
        tags: row.tags || [],
        category_id: row.category_id,
        category_slug: row.category_slug,
        media_unit_id: row.media_unit_id,
      };

      const target: AutoPublishTarget = {
        id: row.target_id,
        media_unit_id: row.media_unit_id,
        name: row.target_name,
        api_url: row.api_url,
        api_token: row.api_token,
        auth_type: row.auth_type || 'bearer',
        default_category_id: row.default_category_id,
        category_mappings: row.category_mappings || {},
        default_auto_publish: row.default_auto_publish ?? true,
        default_pin: row.default_pin ?? 0,
        categories_api_url: row.categories_api_url || null,
        publish_mode: row.publish_mode || 'automated',
        manual_enabled: row.manual_enabled ?? false,
        auto_enabled: row.auto_enabled ?? true,
        is_enabled: true,
        created_at: '',
        updated_at: '',
      };

      const publishResult = await this.publishOneToTarget(article, target);

      if (publishResult.success) {
        result.success++;
        result.details.push({
          articleId: article.id,
          targetId: target.id,
          targetName: target.name,
          title: article.title,
          status: 'success',
          responseCode: publishResult.responseCode,
        });
      } else {
        result.failed++;
        result.details.push({
          articleId: article.id,
          targetId: target.id,
          targetName: target.name,
          title: article.title,
          status: 'failed',
          error: publishResult.error,
        });
      }

      // تأخير بين كل طلب (5 ثواني) لتجنب rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return result;
  }

  /**
   * جلب سجل النشر التلقائي
   */
  async getLog(options: { targetId?: number; limit?: number } = {}): Promise<any[]> {
    const { targetId, limit = 50 } = options;

    let sql = `
      SELECT apl.*, apl.external_url, apl.external_id,
             rd.title as article_title, apt.name as target_name, mu.name as media_unit_name
      FROM auto_publish_log apl
      JOIN auto_publish_targets apt ON apt.id = apl.target_id
      JOIN media_units mu ON mu.id = apt.media_unit_id
      LEFT JOIN raw_data rd ON rd.id = apl.raw_data_id
    `;
    const params: any[] = [];

    if (targetId) {
      sql += ` WHERE apl.target_id = $1`;
      params.push(targetId);
    }

    sql += ` ORDER BY apl.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * نشر خبر واحد يدوياً (للمحرر) على هدف معين
   * يُستخدم للأخبار التحريرية — المحرر يكبس زر وينشر
   * overrides: الإعدادات التي اختارها من dialog قبل النشر
   */
  async publishOneManually(rawDataId: number, targetId: number, overrides?: {
    category_id?: number;
    auto_publish?: boolean;
    pin?: number;
  }): Promise<{
    success: boolean;
    responseCode?: number;
    error?: string;
    externalUrl?: string;
    externalId?: number;
  }> {
    // جلب الهدف
    const target = await this.getTargetById(targetId);
    if (!target) {
      return { success: false, error: 'هدف النشر غير موجود' };
    }
    if (!target.is_enabled && !target.manual_enabled) {
      return { success: false, error: 'النشر اليدوي متوقف لهذا الهدف' };
    }

    // جلب بيانات الخبر — نُفضّل النسخة المعدّلة من published_items (للأخبار التحريرية)
    // وإن لم توجد نُرجِع للنسخة الأصلية من raw_data (للأخبار الأوتوماتيكية)
    const articleResult = await query(
      `SELECT rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.category_id,
              c.slug as category_slug
       FROM raw_data rd
       LEFT JOIN categories c ON c.id = rd.category_id
       LEFT JOIN LATERAL (
         SELECT title, content, image_url, tags
         FROM published_items
         WHERE raw_data_id = rd.id AND is_active = true
         ORDER BY published_at DESC
         LIMIT 1
       ) pi ON TRUE
       WHERE rd.id = $1`,
      [rawDataId]
    );

    if (articleResult.rows.length === 0) {
      return { success: false, error: 'الخبر غير موجود' };
    }

    const row = articleResult.rows[0];
    const article: AutoPublishArticle = {
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: target.media_unit_id,
    };

    // فحص إذا تم نشره مسبقاً
    const alreadyPublished = await query(
      `SELECT id FROM auto_publish_log WHERE target_id = $1 AND raw_data_id = $2 AND status = 'success'`,
      [targetId, rawDataId]
    );
    if (alreadyPublished.rows.length > 0) {
      return { success: false, error: 'الخبر منشور مسبقاً على هذا الهدف' };
    }

    return this.publishOneToTarget(article, target, overrides);
  }

  /**
   * جلب التصنيفات من API الموقع الخارجي (مثل موقع النجاح)
   * يُستخدم في dialog قبل النشر لعرض قائمة التصنيفات للمحرر
   */
  async fetchExternalCategories(targetId: number): Promise<{
    id: number;
    title: string;
    parent_id?: number | null;
    children?: { id: number; title: string }[];
  }[]> {
    const target = await this.getTargetById(targetId);
    if (!target || !target.categories_api_url) {
      return [];
    }

    const authHeader = target.auth_type === 'token'
      ? `Token ${target.api_token}`
      : `Bearer ${target.api_token}`;

    // جلب كل الصفحات
    const allCategories: any[] = [];
    let nextUrl: string | null = target.categories_api_url;

    try {
      while (nextUrl) {
        const currentUrl = nextUrl;
        const fetchRes = await fetch(currentUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': authHeader,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!fetchRes.ok) {
          console.error(`❌ فشل جلب التصنيفات (${fetchRes.status}) من: ${currentUrl}`);
          break;
        }

        const pageData = await fetchRes.json() as { results?: any[]; next?: string | null } | any[];
        const results = (pageData as any).results || (Array.isArray(pageData) ? pageData : []);
        allCategories.push(...results);

        // pagination
        const maybeNext = (pageData as any).next;
        nextUrl = (typeof maybeNext === 'string' && maybeNext.startsWith('http')) ? maybeNext : null;
      }
    } catch (err) {
      console.error('❌ خطأ في جلب التصنيفات الخارجية:', err);
    }

    // تسطيح الشجرة (parent + children)
    const flat: { id: number; title: string; parent_id?: number | null; children?: any[] }[] = [];
    for (const cat of allCategories) {
      flat.push({ id: cat.id, title: cat.title, parent_id: null, children: cat.children || [] });
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          flat.push({ id: child.id, title: child.title, parent_id: cat.id });
        }
      }
    }

    return flat;
  }

  /**
   * جلب رابط النشر الخارجي لخبر معين
   * يُستخدم في الأرشيف لعرض رابط الخبر على الموقع الخارجي
   */
  async getExternalLinks(rawDataId: number): Promise<{ targetName: string; externalUrl: string; publishedAt: string }[]> {
    const result = await query(
      `SELECT apt.name as target_name, apl.external_url, apl.published_at
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = $1 AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataId]
    );
    return result.rows.map((row: any) => ({
      targetName: row.target_name,
      externalUrl: row.external_url,
      publishedAt: row.published_at,
    }));
  }

  /**
   * جلب روابط النشر الخارجي لمجموعة أخبار (batch)
   * يُستخدم في الأرشيف لعرض الروابط بجانب كل خبر
   */
  async getExternalLinksForArticles(rawDataIds: number[]): Promise<Record<number, { targetName: string; externalUrl: string }[]>> {
    if (rawDataIds.length === 0) return {};

    const result = await query(
      `SELECT apl.raw_data_id, apt.name as target_name, apl.external_url
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = ANY($1) AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataIds]
    );

    const map: Record<number, { targetName: string; externalUrl: string }[]> = {};
    for (const row of result.rows) {
      if (!map[row.raw_data_id]) map[row.raw_data_id] = [];
      map[row.raw_data_id].push({ targetName: row.target_name, externalUrl: row.external_url });
    }
    return map;
  }

  /**
   * إحصائيات النشر التلقائي
   */
  async getStats(): Promise<{
    masterEnabled: boolean;
    targets: {
      id: number;
      name: string;
      mediaUnitName: string;
      isEnabled: boolean;
      manualEnabled: boolean;
      autoEnabled: boolean;
      totalPublished: number;
      totalFailed: number;
      publishedToday: number;
      lastPublishedAt: string | null;
    }[];
  }> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);

    const result = await query(
      `SELECT 
         apt.id, apt.name, apt.is_enabled, apt.manual_enabled, apt.auto_enabled,
         mu.name as media_unit_name,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success') as total_published,
         COUNT(apl.id) FILTER (WHERE apl.status = 'failed') as total_failed,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success' AND apl.published_at > NOW() - INTERVAL '24 hours') as published_today,
         MAX(CASE WHEN apl.status = 'success' THEN apl.published_at END) as last_published_at
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       LEFT JOIN auto_publish_log apl ON apl.target_id = apt.id
       GROUP BY apt.id, apt.name, apt.is_enabled, apt.manual_enabled, apt.auto_enabled, mu.name
       ORDER BY apt.media_unit_id, apt.name`
    );

    return {
      masterEnabled,
      targets: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        mediaUnitName: row.media_unit_name,
        isEnabled: row.is_enabled,
        manualEnabled: row.manual_enabled ?? false,
        autoEnabled: row.auto_enabled ?? false,
        totalPublished: parseInt(row.total_published) || 0,
        totalFailed: parseInt(row.total_failed) || 0,
        publishedToday: parseInt(row.published_today) || 0,
        lastPublishedAt: row.last_published_at || null,
      })),
    };
  }
}

// تصدير instance واحد
export const autoPublishService = new AutoPublishService();
