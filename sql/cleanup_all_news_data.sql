-- ============================================================================
-- SQL Script: حذف جميع بيانات الأخبار بالترتيب الصحيح
-- ============================================================================
-- الترتيب الصحيح لحذف البيانات (لتجنب foreign key constraint errors):
-- 1. published_items (تشير لـ raw_data و editorial_queue)
-- 2. editorial_queue (تشير لـ raw_data)
-- 3. raw_data
-- ============================================================================

-- ── المرحلة 1: حذف المحتوى المنشور ──────────────────────────────────────────
-- حذف جميع العناصر المنشورة
DELETE FROM published_items;

-- ── المرحلة 2: حذف طابور التحرير ───────────────────────────────────────────
-- حذف جميع العناصر في طابور التحرير
DELETE FROM editorial_queue;

-- ── المرحلة 3: حذف البيانات الخام ───────────────────────────────────────────
-- حذف جميع الأخبار الخام
DELETE FROM raw_data;

-- ── التحقق من الحذف ─────────────────────────────────────────────────────────
-- يجب أن ترجع 0 لجميع الجداول
SELECT 'published_items' as table_name, COUNT(*) as count FROM published_items
UNION ALL
SELECT 'editorial_queue', COUNT(*) FROM editorial_queue
UNION ALL
SELECT 'raw_data', COUNT(*) FROM raw_data;

-- إذا أردت إعادة تعيين الـ auto-increment IDs بعد الحذف:
-- PostgreSQL:
-- ALTER SEQUENCE published_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE editorial_queue_id_seq RESTART WITH 1;
-- ALTER SEQUENCE raw_data_id_seq RESTART WITH 1;

-- MySQL:
-- ALTER TABLE published_items AUTO_INCREMENT = 1;
-- ALTER TABLE editorial_queue AUTO_INCREMENT = 1;
-- ALTER TABLE raw_data AUTO_INCREMENT = 1;
