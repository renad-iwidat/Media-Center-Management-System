-- ═══════════════════════════════════════════════════════════════════════════
-- تفعيل النشر التلقائي للأخبار الأوتوماتيكية (صحة، تكنولوجيا، رياضة، اقتصاد...)
-- Enable Auto-Publish for Automated Categories
-- ═══════════════════════════════════════════════════════════════════════════
--
-- هذا السكريبت يفعّل النشر التلقائي على الموقع الخارجي (هنا غزة)
-- للأخبار ذات التصنيفات الأوتوماتيكية:
--   - صحة (5)
--   - علوم وتكنولوجيا (6)
--   - رياضة (4)
--   - اقتصاد (3)
--   - فن وثقافة (7)
--   - بيئة (9)
--   - غذاء (10)
--
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. تفعيل الـ Master Switch (النشر التلقائي بشكل عام)
UPDATE system_settings 
SET value = 'true', updated_at = NOW()
WHERE key = 'auto_publish_enabled';

-- إذا لم يكن موجوداً، أنشئه
INSERT INTO system_settings (key, value, description)
VALUES ('auto_publish_enabled', 'true', 'تشغيل/إيقاف النشر التلقائي على المواقع الخارجية (master switch)')
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

-- 2. تفعيل هدف النشر (هنا غزة)
UPDATE auto_publish_targets 
SET is_enabled = true, updated_at = NOW()
WHERE name = 'موقع هنا غزة';

-- 3. تحقق من الإعدادات
SELECT '=== Master Switch ===' as section;
SELECT key, value FROM system_settings WHERE key = 'auto_publish_enabled';

SELECT '=== Auto-Publish Targets ===' as section;
SELECT id, name, media_unit_id, is_enabled, api_url 
FROM auto_publish_targets 
ORDER BY id;

-- 4. تحقق من التصنيفات الأوتوماتيكية
SELECT '=== Automated Categories ===' as section;
SELECT id, name, slug, flow 
FROM categories 
WHERE flow = 'automated'
ORDER BY id;

-- 5. تحقق من الأخبار الجاهزة للنشر التلقائي (لم تُنشر بعد)
SELECT '=== Articles Ready for Auto-Publish ===' as section;
SELECT COUNT(*) as ready_count
FROM published_items pi
JOIN raw_data rd ON rd.id = pi.raw_data_id
JOIN categories c ON c.id = rd.category_id
WHERE pi.is_active = true
  AND c.flow = 'automated'
  AND rd.id NOT IN (
    SELECT raw_data_id FROM auto_publish_log WHERE status = 'success'
  );
