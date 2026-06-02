-- ============================================================
-- إعادة تصفير كل جداول الأخبار
-- يحذف كل المحتويات ويرجع العداد (sequence) للـ 1
-- 
-- ⚠️ تحذير: هذا يحذف كل البيانات بشكل نهائي!
-- الترتيب مهم بسبب الـ Foreign Keys
-- ============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- المرحلة 1: حذف الجداول التابعة أولاً (التي تعتمد على غيرها)
-- ══════════════════════════════════════════════════════════════

-- 1. auto_publish_log (مرتبط بـ raw_data عبر cascade)
TRUNCATE TABLE auto_publish_log RESTART IDENTITY CASCADE;

-- 2. content_source (مرتبط بعدة جداول عبر cascade)
TRUNCATE TABLE content_source RESTART IDENTITY CASCADE;

-- 3. published_items (يعتمد على editorial_queue + raw_data + media_units)
TRUNCATE TABLE published_items RESTART IDENTITY CASCADE;

-- 4. editorial_queue (يعتمد على raw_data + media_units)
TRUNCATE TABLE editorial_queue RESTART IDENTITY CASCADE;

-- 5. raw_data (يعتمد على sources + source_types + categories + media_units)
TRUNCATE TABLE raw_data RESTART IDENTITY CASCADE;

-- ══════════════════════════════════════════════════════════════
-- المرحلة 2: حذف الجداول الأساسية
-- ══════════════════════════════════════════════════════════════

-- 6. sources (يعتمد على source_types)
TRUNCATE TABLE sources RESTART IDENTITY CASCADE;

-- 7. source_types
TRUNCATE TABLE source_types RESTART IDENTITY CASCADE;

-- 8. media_units
TRUNCATE TABLE media_units RESTART IDENTITY CASCADE;

-- 9. categories
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- 10. geographic_scopes
TRUNCATE TABLE geographic_scopes RESTART IDENTITY CASCADE;

COMMIT;

-- ══════════════════════════════════════════════════════════════
-- ✅ تم! كل الجداول فاضية والعدادات ترجع من 1
-- ══════════════════════════════════════════════════════════════
