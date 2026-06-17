-- ============================================================
-- Migration: إضافة حد يومي للنشر التلقائي لكل هدف
-- daily_auto_limit: الحد الأقصى لعدد الأخبار المنشورة تلقائياً يومياً
-- ⚠️ هذا الحد يخص النشر التلقائي فقط (السكيدولر) — لا يؤثر على النشر اليدوي
-- ============================================================

-- إضافة عمود الحد اليومي (NULL = بدون حد / unlimited)
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS daily_auto_limit INTEGER DEFAULT NULL;

-- تعليق: NULL يعني لا يوجد حد — الرقم يعني الحد الأقصى للنشر التلقائي يومياً
COMMENT ON COLUMN auto_publish_targets.daily_auto_limit IS 
  'الحد اليومي للنشر التلقائي (NULL = بلا حد). يخص فقط النشر التلقائي ولا يؤثر على اليدوي.';

-- ============================================================
-- إضافة عمود is_manual لجدول auto_publish_log
-- لتمييز النشر اليدوي (من المحرر) عن النشر التلقائي (من السكيدولر)
-- ============================================================

ALTER TABLE auto_publish_log
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false;

-- فهرس للتصفية حسب النوع (تلقائي/يدوي) واليوم
CREATE INDEX IF NOT EXISTS idx_auto_publish_log_manual_date 
  ON auto_publish_log(target_id, is_manual, status, published_at);

-- ============================================================
-- تعيين حد افتراضي 50 خبر يومياً لجميع المواقع الخارجية
-- ============================================================
UPDATE auto_publish_targets SET daily_auto_limit = 50;
