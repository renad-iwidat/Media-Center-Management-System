-- ============================================================================
-- SQL Script: حذف بيانات الأخبار باختياري
-- ============================================================================

-- ── حذف الأخبار الناقصة فقط (is_incomplete = true) ────────────────────────────
-- 1. حذف من published_items (إن وجدت)
DELETE FROM published_items
WHERE raw_data_id IN (
  SELECT id FROM raw_data WHERE is_incomplete = true
);

-- 2. حذف من editorial_queue (إن وجدت)
DELETE FROM editorial_queue
WHERE raw_data_id IN (
  SELECT id FROM raw_data WHERE is_incomplete = true
);

-- 3. حذف من raw_data
DELETE FROM raw_data WHERE is_incomplete = true;

-- ── حذف الأخبار من مصدر معين ────────────────────────────────────────────────
-- انسخ هالـ SQL وعدل source_id بالرقم المطلوب
-- DELETE FROM published_items WHERE raw_data_id IN (SELECT id FROM raw_data WHERE source_id = 1);
-- DELETE FROM editorial_queue WHERE raw_data_id IN (SELECT id FROM raw_data WHERE source_id = 1);
-- DELETE FROM raw_data WHERE source_id = 1;

-- ── حذف الأخبار القديمة (أقدم من 30 يوم) ─────────────────────────────────────
-- DELETE FROM published_items WHERE raw_data_id IN (
--   SELECT id FROM raw_data WHERE fetched_at < NOW() - INTERVAL '30 days'
-- );
-- DELETE FROM editorial_queue WHERE raw_data_id IN (
--   SELECT id FROM raw_data WHERE fetched_at < NOW() - INTERVAL '30 days'
-- );
-- DELETE FROM raw_data WHERE fetched_at < NOW() - INTERVAL '30 days';

-- ── حذف الأخبار بدون تصنيف (category_id IS NULL) ─────────────────────────────
-- DELETE FROM published_items WHERE raw_data_id IN (
--   SELECT id FROM raw_data WHERE category_id IS NULL
-- );
-- DELETE FROM editorial_queue WHERE raw_data_id IN (
--   SELECT id FROM raw_data WHERE category_id IS NULL
-- );
-- DELETE FROM raw_data WHERE category_id IS NULL;
