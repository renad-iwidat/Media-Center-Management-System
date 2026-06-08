-- ============================================================================
-- 🔧 إصلاح حالة الأخبار غير المكتملة
-- ============================================================================
-- هذا السكريبت يصحح حالة الأخبار بناءً على المعايير الصحيحة:
-- - المحتوى < 300 حرف OR صورة فارغة = incomplete
-- ============================================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════════════════
-- 1. تحديث is_incomplete في raw_data بناءً على المعايير الصحيحة (300 حرف)
-- ══════════════════════════════════════════════════════════════════════════

-- تحديث الأخبار الناقصة (محتوى قصير أو بدون صورة)
UPDATE raw_data
SET is_incomplete = true
WHERE (
  LENGTH(COALESCE(content, '')) < 300 
  OR image_url IS NULL 
  OR TRIM(image_url) = ''
)
AND fetch_status IN ('fetched', 'processed')
AND is_incomplete = false;

-- تحديث الأخبار المكتملة (محتوى كافي وصورة موجودة)
UPDATE raw_data
SET is_incomplete = false
WHERE LENGTH(COALESCE(content, '')) >= 300
AND image_url IS NOT NULL
AND TRIM(image_url) != ''
AND fetch_status IN ('fetched', 'processed')
AND is_incomplete = true;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. تحديث حالة editorial_queue للأخبار غير المكتملة
-- ══════════════════════════════════════════════════════════════════════════

-- تحديث الأخبار في queue من pending/in_review إلى incomplete إذا كانت ناقصة
UPDATE editorial_queue eq
SET status = 'incomplete'
FROM raw_data rd
WHERE eq.raw_data_id = rd.id
AND rd.is_incomplete = true
AND eq.status IN ('pending', 'in_review')
AND NOT EXISTS (
  SELECT 1 FROM published_items pi WHERE pi.raw_data_id = rd.id
);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. التحقق من النتائج
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'النتيجة النهائية' AS section,
  is_incomplete,
  COUNT(*) AS count,
  COUNT(CASE WHEN LENGTH(COALESCE(content, '')) < 300 THEN 1 END) AS short_content,
  COUNT(CASE WHEN image_url IS NULL OR TRIM(image_url) = '' THEN 1 END) AS no_image
FROM raw_data
WHERE fetch_status IN ('fetched', 'processed')
GROUP BY is_incomplete
ORDER BY is_incomplete DESC;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. عرض الأخبار غير المكتملة بعد التصحيح
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'أخبار incomplete بعد الإصلاح' AS info,
  id,
  SUBSTRING(title, 1, 60) AS title,
  LENGTH(COALESCE(content, '')) AS content_length,
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    WHEN TRIM(image_url) = '' THEN 'فارغة'
    ELSE 'موجودة'
  END AS image_status,
  fetch_status
FROM raw_data
WHERE is_incomplete = true
AND fetch_status IN ('fetched', 'processed')
ORDER BY fetched_at DESC
LIMIT 20;
