-- ============================================================
-- إضافة موقع النجاح كموقع نشر خارجي
-- Adding Najah News (nn.najah.edu) as external publishing site
-- ============================================================

-- إدراج هدف "موقع النجاح" — الوحدة الإعلامية "النجاح"
-- Category Mapping (محلي → موقع النجاح nn.ps):
--   1  محلي              →  12 الأخبار المحلية
--   2  دولي              →  4  الأخبار الدولية
--   3  اقتصاد            →  6  الاقتصاد
--   4  رياضة             →  7  الرياضة
--   5  صحة               →  2  الصحة
--   6  علوم وتكنولوجيا   →  8  تكنولوجيا
--   7  فن و ثقافة        →  9  الثقافة
--   9  بيئة              →  10 اجتماعي
--   10 غذاء              →  13 أخبار عامة
--   11 سياسي             →  5  السياسة

-- الخطوة 1: التحقق من وجود الوحدة الإعلامية "النجاح"
-- إذا لم تكن موجودة، أنشئها
INSERT INTO media_units (name, slug, is_active)
VALUES ('النجاح', 'najah', true)
ON CONFLICT (slug) DO NOTHING;

-- الخطوة 2: إضافة موقع النجاح كهدف نشر خارجي
INSERT INTO auto_publish_targets (
  media_unit_id, 
  name, 
  api_url, 
  api_token, 
  default_category_id, 
  is_enabled
)
SELECT 
  mu.id,
  'موقع النجاح',
  'https://nn.najah.edu/api/v1/news/article/',
  '9eedb2ef002f23c08c23b2b1adbc2fc2ff3da320',
  12,  -- التصنيف الافتراضي: الأخبار المحلية
  false -- متوقف افتراضياً — يمكن تفعيله لاحقاً
FROM media_units mu
WHERE mu.slug = 'najah'
ON CONFLICT DO NOTHING;

-- الخطوة 3: عرض النتيجة
SELECT 
  apt.id,
  apt.name AS "Target Name",
  mu.name AS "Media Unit",
  apt.api_url AS "API URL",
  apt.is_enabled AS "Enabled",
  apt.created_at AS "Created At"
FROM auto_publish_targets apt
JOIN media_units mu ON mu.id = apt.media_unit_id
WHERE apt.name = 'موقع النجاح';

-- ملاحظات:
-- 1. الموقع معطل افتراضياً (is_enabled = false)
-- 2. لتفعيله، استخدم:
--    UPDATE auto_publish_targets SET is_enabled = true WHERE name = 'موقع النجاح';
-- 
-- 3. للتحقق من Master Switch:
--    SELECT * FROM system_settings WHERE key = 'auto_publish_enabled';
-- 
-- 4. لتفعيل Master Switch:
--    UPDATE system_settings SET value = 'true' WHERE key = 'auto_publish_enabled';
