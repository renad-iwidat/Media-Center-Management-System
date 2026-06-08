-- ============================================================================
-- 🔍 فحص الأخبار غير المكتملة وتشخيص المشكلة
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- 1. إحصائيات عامة عن حالة الأخبار
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'إحصائيات عامة' AS section,
  is_incomplete,
  fetch_status,
  COUNT(*) AS count
FROM raw_data
GROUP BY is_incomplete, fetch_status
ORDER BY is_incomplete DESC, count DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. الأخبار التي يجب أن تكون غير مكتملة (حسب المعايير الحالية)
-- المعايير: طول المحتوى < 100 حرف OR صورة فارغة
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'أخبار يجب أن تكون incomplete' AS section,
  COUNT(*) AS total_should_be_incomplete,
  COUNT(CASE WHEN LENGTH(COALESCE(content, '')) < 100 THEN 1 END) AS missing_content,
  COUNT(CASE WHEN image_url IS NULL OR TRIM(image_url) = '' THEN 1 END) AS missing_image,
  COUNT(CASE WHEN LENGTH(COALESCE(content, '')) < 100 AND (image_url IS NULL OR TRIM(image_url) = '') THEN 1 END) AS missing_both
FROM raw_data
WHERE (LENGTH(COALESCE(content, '')) < 100 OR image_url IS NULL OR TRIM(image_url) = '')
  AND fetch_status IN ('fetched', 'processed');

-- ══════════════════════════════════════════════════════════════════════════
-- 3. مقارنة بين قيمة is_incomplete والمعايير الفعلية
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'مطابقة المعايير' AS section,
  CASE 
    WHEN is_incomplete = true AND (LENGTH(COALESCE(content, '')) < 100 OR image_url IS NULL OR TRIM(image_url) = '') THEN 'صحيح - incomplete'
    WHEN is_incomplete = false AND LENGTH(COALESCE(content, '')) >= 100 AND image_url IS NOT NULL AND TRIM(image_url) != '' THEN 'صحيح - complete'
    WHEN is_incomplete = true AND LENGTH(COALESCE(content, '')) >= 100 AND image_url IS NOT NULL AND TRIM(image_url) != '' THEN 'خطأ - مكتمل لكن موسوم incomplete'
    WHEN is_incomplete = false AND (LENGTH(COALESCE(content, '')) < 100 OR image_url IS NULL OR TRIM(image_url) = '') THEN 'خطأ - ناقص لكن موسوم complete'
    ELSE 'آخر'
  END AS status_match,
  COUNT(*) AS count
FROM raw_data
WHERE fetch_status IN ('fetched', 'processed')
GROUP BY status_match
ORDER BY count DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. عينة من الأخبار غير المكتملة (is_incomplete = true)
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '🔴 عينة أخبار incomplete' AS section,
  id,
  SUBSTRING(title, 1, 50) AS title_preview,
  LENGTH(COALESCE(content, '')) AS content_length,
  CASE 
    WHEN image_url IS NULL THEN 'لا توجد'
    WHEN TRIM(image_url) = '' THEN 'فارغة'
    ELSE 'موجودة'
  END AS image_status,
  fetch_status,
  fetched_at
FROM raw_data
WHERE is_incomplete = true
ORDER BY fetched_at DESC
LIMIT 10;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. الأخبار الناقصة التي لم يتم تحديد is_incomplete لها
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '⚠️ أخبار ناقصة لكن is_incomplete = false' AS section,
  id,
  SUBSTRING(title, 1, 50) AS title_preview,
  LENGTH(COALESCE(content, '')) AS content_length,
  CASE 
    WHEN image_url IS NULL THEN 'لا توجد'
    WHEN TRIM(image_url) = '' THEN 'فارغة'
    ELSE 'موجودة'
  END AS image_status,
  fetch_status
FROM raw_data
WHERE is_incomplete = false
  AND (LENGTH(COALESCE(content, '')) < 100 OR image_url IS NULL OR TRIM(image_url) = '')
  AND fetch_status IN ('fetched', 'processed')
ORDER BY fetched_at DESC
LIMIT 10;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. فحص editorial_queue للأخبار غير المكتملة
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  'editorial_queue status' AS section,
  eq.status,
  rd.is_incomplete,
  COUNT(*) AS count
FROM editorial_queue eq
LEFT JOIN raw_data rd ON eq.raw_data_id = rd.id
GROUP BY eq.status, rd.is_incomplete
ORDER BY count DESC;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. الأخبار في editorial_queue بحالة 'incomplete'
-- ══════════════════════════════════════════════════════════════════════════
SELECT 
  '✅ أخبار في queue بحالة incomplete' AS section,
  eq.id AS queue_id,
  eq.raw_data_id,
  SUBSTRING(rd.title, 1, 50) AS title_preview,
  LENGTH(COALESCE(rd.content, '')) AS content_length,
  CASE 
    WHEN rd.image_url IS NULL THEN 'لا توجد'
    WHEN TRIM(rd.image_url) = '' THEN 'فارغة'
    ELSE 'موجودة'
  END AS image_status,
  rd.is_incomplete AS rd_is_incomplete,
  mu.name AS media_unit
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
LEFT JOIN media_units mu ON eq.media_unit_id = mu.id
WHERE eq.status = 'incomplete'
ORDER BY eq.created_at DESC
LIMIT 10;
