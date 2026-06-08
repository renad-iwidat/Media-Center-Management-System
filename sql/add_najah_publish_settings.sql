-- ============================================================
-- Migration: إضافة أعمدة إعدادات النشر لجدول auto_publish_targets
-- يدعم: auth_type, category_mappings, default_auto_publish, default_pin
-- ============================================================

-- 1. نوع المصادقة (bearer = هنا غزة / token = النجاح)
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) NOT NULL DEFAULT 'bearer';

-- 2. mapping التصنيفات (JSONB: { "local_id": external_id, ... })
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS category_mappings JSONB DEFAULT '{}';

-- 3. هل ينشر مباشرة أم يحفظ كمسودة افتراضياً
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS default_auto_publish BOOLEAN NOT NULL DEFAULT true;

-- 4. قيمة pin الافتراضية (0-5)
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS default_pin INTEGER NOT NULL DEFAULT 0;

-- 5. رابط API لجلب التصنيفات من الموقع الخارجي (اختياري)
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS categories_api_url TEXT;

-- ============================================================
-- تحديث موقع هنا غزة بالإعدادات الصحيحة
-- ============================================================
UPDATE auto_publish_targets
SET
  auth_type = 'bearer',
  category_mappings = '{
    "1":  1,
    "2":  4,
    "3":  6,
    "4":  7,
    "5":  2,
    "6":  8,
    "7":  9,
    "9":  10,
    "10": 13,
    "11": 5
  }'::jsonb,
  default_auto_publish = true,
  default_pin = 0
WHERE name = 'موقع هنا غزة';

-- ============================================================
-- تحديث موقع النجاح بالإعدادات الصحيحة
-- ============================================================
UPDATE auto_publish_targets
SET
  auth_type = 'token',
  category_mappings = '{
    "1":  146,
    "2":  22,
    "3":  21,
    "4":  22,
    "5":  22,
    "6":  24,
    "7":  23,
    "9":  31,
    "10": 31,
    "11": 22
  }'::jsonb,
  default_auto_publish = false,
  default_pin = 0,
  categories_api_url = 'https://nn.najah.edu/api/v1/news/category/'
WHERE name = 'موقع النجاح';

-- ============================================================
-- التحقق من النتيجة
-- ============================================================
SELECT
  id,
  name,
  auth_type,
  default_auto_publish,
  default_pin,
  categories_api_url,
  jsonb_object_keys(category_mappings) AS mapped_categories
FROM auto_publish_targets
ORDER BY name;
