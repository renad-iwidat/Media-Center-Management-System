-- ============================================================
-- Migration: توسيع raw_data و sources لدعم NewsDesk API
-- 
-- الهدف: إضافة الأعمدة الناقصة فقط (بدون تكرار)
-- content = النص الكامل (كما هو)
-- source_id = FK على sources (فيه الاسم)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. إضافة slug لجدول sources (لربط المصادر من الـ API)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE sources ADD COLUMN IF NOT EXISTS slug VARCHAR(255) DEFAULT '';

COMMENT ON COLUMN sources.slug IS 'slug المصدر — للربط مع NewsDesk API';

CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_slug 
  ON sources(slug) 
  WHERE slug != '';

-- ══════════════════════════════════════════════════════════════
-- 2. أعمدة جديدة لجدول raw_data (فقط يلي مش موجودة)
-- ══════════════════════════════════════════════════════════════

-- الملخص (content = النص الكامل، summary = الملخص القصير)
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';

-- الكاتب
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS authors VARCHAR(500) DEFAULT '';

-- اللغة
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ar';

-- slug المصدر (للربط السريع مع API بدون JOIN)
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS source_slug VARCHAR(255) DEFAULT '';

-- slug التصنيف من الـ API
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS category_slug VARCHAR(100) DEFAULT '';

-- النطاق الجغرافي
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS geo_scope_slug VARCHAR(100) DEFAULT '';

-- ثقة التصنيف الآلي
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,4) DEFAULT NULL;

-- ID المقالة في NewsDesk API (لمنع التكرار)
ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS newsdesk_article_id INTEGER DEFAULT NULL;

-- ══════════════════════════════════════════════════════════════
-- 3. Indexes
-- ══════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_data_newsdesk_id 
  ON raw_data(newsdesk_article_id) 
  WHERE newsdesk_article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_raw_data_language 
  ON raw_data(language);

CREATE INDEX IF NOT EXISTS idx_raw_data_source_slug 
  ON raw_data(source_slug) 
  WHERE source_slug != '';

CREATE INDEX IF NOT EXISTS idx_raw_data_category_slug 
  ON raw_data(category_slug) 
  WHERE category_slug != '';

-- ══════════════════════════════════════════════════════════════
-- 4. إيقاف مصادر RSS القديمة
-- ══════════════════════════════════════════════════════════════جد

UPDATE sources SET is_active = false WHERE source_type_id = 1;
