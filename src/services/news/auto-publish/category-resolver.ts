/**
 * Category Resolver
 * تحديد التصنيف الخارجي المناسب لكل خبر حسب mapping الهدف
 */

import { AutoPublishTarget } from './types';

// ── Fallback Mapping (للأهداف القديمة بدون mappings في الداتابيس) ────────────

const FALLBACK_HGAZA_CATEGORY: Record<number, number> = {
  1:  10,  // مجتمع → اجتماعي
  2:  13,  // أخرى → أخبار عامة
  3:  6,   // اقتصاد → الاقتصاد
  4:  7,   // رياضة → الرياضة
  5:  2,   // صحة → الصحة
  6:  8,   // تكنولوجيا → تكنولوجيا
  7:  9,   // ثقافة → الثقافة
  9:  10,  // بيئة → اجتماعي
  10: 13,  // غذاء → أخبار عامة
  11: 5,   // سياسة → السياسة
  12: 1,   // أخبار محلية → الأخبار المحلية
  13: 13,  // تعليم → أخبار عامة
  14: 4,   // عسكري → أخبار دولية
  15: 9,   // فنون → الثقافة
  16: 13,  // دين → أخبار عامة
  17: 13,  // أخبار عامة → أخبار عامة
};

/**
 * تحديد التصنيف الخارجي بناءً على:
 * 1. mappings الداتابيس (الأولوية)
 * 2. fallback mapping ثابت (للأهداف القديمة)
 * 3. default_category_id (آخر خيار)
 */
export function resolveExternalCategory(
  localCategoryId: number | null,
  target: AutoPublishTarget
): number {
  if (!localCategoryId) return target.default_category_id;

  // من الداتابيس أولاً
  const dbMappings = target.category_mappings || {};
  const dbMapped = dbMappings[String(localCategoryId)];
  if (dbMapped) return dbMapped;

  // fallback: للأهداف القديمة
  if (target.api_url.includes('hgaza.nn.ps')) {
    return FALLBACK_HGAZA_CATEGORY[localCategoryId] || target.default_category_id;
  }

  return target.default_category_id;
}
