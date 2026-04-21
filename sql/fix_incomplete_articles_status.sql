-- =====================================================================
-- إصلاح حالة الأخبار الناقصة القديمة
-- المشكلة: الأخبار الناقصة كانت تبقى بـ fetch_status = 'fetched'
--          فكانت ترجع للفلو في كل دورة وتُعاد معالجتها بدون فائدة
-- الحل:    fetch_status = 'incomplete' للأخبار الناقصة
--          هيك ما بترجع للفلو (اللي بيجلب 'fetched' فقط)
-- =====================================================================

-- 1. تحديث الأخبار الناقصة القديمة (is_incomplete = true لكن status لسا fetched/processed)
UPDATE raw_data
SET fetch_status = 'incomplete'
WHERE is_incomplete = true
  AND fetch_status IN ('fetched', 'processed');

-- 2. تحديث الأخبار اللي محتواها أقل من 300 حرف لكن is_incomplete = false (قديمة قبل الـ flag)
UPDATE raw_data
SET is_incomplete = true,
    fetch_status  = 'incomplete'
WHERE LENGTH(COALESCE(content, '')) < 300
  AND fetch_status = 'fetched'
  AND is_incomplete = false;

-- 3. تحقق من النتيجة
SELECT
  fetch_status,
  is_incomplete,
  COUNT(*) AS count
FROM raw_data
GROUP BY fetch_status, is_incomplete
ORDER BY fetch_status, is_incomplete;
