-- ============================================================
-- إضافة أعمدة رابط النشر الخارجي لجدول auto_publish_log
-- ============================================================

-- رابط الخبر على الموقع الخارجي (مثلاً: https://hgaza.nn.ps/news/22197)
ALTER TABLE auto_publish_log ADD COLUMN IF NOT EXISTS external_url TEXT;

-- ID الخبر على الموقع الخارجي
ALTER TABLE auto_publish_log ADD COLUMN IF NOT EXISTS external_id INTEGER;
