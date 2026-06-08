/**
 * Category Flow Configuration — المصدر الوحيد لتحديد مسار التصنيف
 * ════════════════════════════════════════════════════════════════
 * هذا الملف هو المصدر الوحيد (single source of truth) لقاعدة توجيه
 * التصنيفات. يُستخدم في:
 *   - newsdesk-sync.service: لتعبئة عمود categories.flow عند المزامنة
 *   - flow-router.service:   كـ fallback عند غياب flow بالداتابيس
 *
 * القاعدة معرّفة بالـ slug (وليس الـ id) لأن الـ slug مستقر ولا يتغير
 * حتى لو أُعيد إنشاء جداول التصنيفات من الصفر.
 *
 *   editorial = يروح لقسم التحرير (المحرر لازم يوافق)
 *   automated = ينشر تلقائياً بدون تدخل المحرر
 */

export type CategoryFlow = 'automated' | 'editorial';

/**
 * الفلو الافتراضي لأي تصنيف غير معروف أو جديد يأتي من الـ API.
 *
 * ← 'automated' عن قصد:
 *   أي تصنيف جديد يُجلب من الـ API ولم يُدرج صريحاً في القائمة أدناه
 *   سينشر تلقائياً. فقط التصنيفات المُدرجة صريحاً كـ 'editorial'
 *   تذهب لقسم التحرير.
 */
export const DEFAULT_FLOW: CategoryFlow = 'automated';

/**
 * خريطة الفلو حسب slug التصنيف.
 *
 * القاعدة: فقط التصنيفات التحريرية تُذكر هنا صريحاً.
 * أي slug غير موجود → يأخذ DEFAULT_FLOW (automated).
 *
 * التصنيفات التحريرية الحالية: السياسي، العسكري/الأمني، المحلي، الدولي، الديني.
 */
export const CATEGORY_FLOW_BY_SLUG: Record<string, CategoryFlow> = {
  // ── تحريري (editorial) — يجب موافقة المحرر ──────────
  politics:  'editorial',   // سياسي
  security:  'editorial',   // عسكري/أمني
  religion:  'editorial',   // ديني

  // كل ما عدا هؤلاء الثلاثة → automated (بما فيهم أي slug جديد من الـ API)
};

/**
 * تحديد الفلو من slug التصنيف
 */
export function getFlowBySlug(slug: string | null | undefined): CategoryFlow {
  if (!slug) return DEFAULT_FLOW;
  return CATEGORY_FLOW_BY_SLUG[slug] || DEFAULT_FLOW;
}
