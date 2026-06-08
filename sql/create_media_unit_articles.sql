-- ============================================================
-- Migration: إنشاء جدول media_unit_articles
--
-- الفكرة: فصل الخبر الأصلي (raw_data = canonical / ثابت)
--         عن النسخة المعالجة الخاصة بكل وحدة إعلامية (projection)
--
--   raw_data ──1:N──> media_unit_articles ──> editorial_queue / published_items
--
-- • raw_data         = المحتوى الأصلي، يُخزّن مرة وحدة، لا يُعدّل
-- • media_unit_articles = نسخة مستقلة لكل (خبر + وحدة):
--     - عنوان/ملخص/محتوى/وسوم خاصة بالوحدة (NULL = يرث من raw_data)
--     - تصنيف AI مستقل لكل وحدة
--     - حالة معالجة خاصة بالوحدة
--   تعديل وحدة لا يؤثر على باقي الوحدات، والمحتوى الأصلي ما بينكرّر
--   إلا لما الوحدة تعدّله فعلاً.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. الجدول
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS media_unit_articles (
  id                  BIGSERIAL PRIMARY KEY,

  -- ── الروابط ─────────────────────────────────────────────
  raw_data_id         BIGINT  NOT NULL REFERENCES raw_data(id)     ON DELETE CASCADE,
  media_unit_id       BIGINT  NOT NULL REFERENCES media_units(id)  ON DELETE CASCADE,
  source_id           BIGINT  REFERENCES sources(id),              -- المصدر اللي ربط الخبر بالوحدة
  newsdesk_article_id INTEGER,                                     -- ID الخبر بالـ API (للمزامنة التدريجية)

  -- ── المحتوى الخاص بالوحدة (NULL = يرث من raw_data) ──────
  title               TEXT,
  summary             TEXT,
  content             TEXT,
  image_url           TEXT,
  tags                TEXT[] DEFAULT '{}',

  -- ── تصنيف AI مستقل لكل وحدة ─────────────────────────────
  category_id         BIGINT  REFERENCES categories(id),
  geo_scope_id        INTEGER REFERENCES geographic_scopes(id),
  ai_confidence       NUMERIC(5,4) DEFAULT NULL,
  ai_processed        BOOLEAN DEFAULT false,

  -- ── دورة حياة خاصة بالوحدة ──────────────────────────────
  status              VARCHAR(20) DEFAULT 'pending',  -- pending|processing|ready|published|rejected
  flow                VARCHAR(20),                    -- automated|editorial
  is_modified         BOOLEAN DEFAULT false,          -- هل المحرر عدّل النسخة؟
  is_incomplete       BOOLEAN DEFAULT false,

  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- نسخة واحدة فقط لكل (خبر + وحدة)
  UNIQUE (raw_data_id, media_unit_id)
);

COMMENT ON TABLE media_unit_articles IS 'نسخة معالجة مستقلة من الخبر لكل وحدة إعلامية — الأصل يبقى ثابت في raw_data';
COMMENT ON COLUMN media_unit_articles.title   IS 'عنوان خاص بالوحدة — NULL يعني استخدم raw_data.title';
COMMENT ON COLUMN media_unit_articles.content IS 'محتوى خاص بالوحدة — NULL يعني استخدم raw_data.content';
COMMENT ON COLUMN media_unit_articles.is_modified IS 'true إذا المحرر عدّل النسخة (تختلف عن الأصل)';

-- ══════════════════════════════════════════════════════════════
-- 2. Indexes
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_mua_raw_data
  ON media_unit_articles(raw_data_id);

CREATE INDEX IF NOT EXISTS idx_mua_unit_status
  ON media_unit_articles(media_unit_id, status);

CREATE INDEX IF NOT EXISTS idx_mua_newsdesk
  ON media_unit_articles(newsdesk_article_id)
  WHERE newsdesk_article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mua_source
  ON media_unit_articles(source_id);

-- ══════════════════════════════════════════════════════════════
-- 3. View — النسخة بعد دمجها مع الأصل (resolved)
--    تستخدم COALESCE حتى ترجع قيمة الوحدة إن وُجدت وإلا الأصل
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_media_unit_articles AS
SELECT
  mua.id,
  mua.raw_data_id,
  mua.media_unit_id,
  mua.source_id,
  mua.newsdesk_article_id,
  mua.status,
  mua.flow,
  mua.is_modified,
  mua.is_incomplete,
  mua.ai_processed,
  COALESCE(mua.title,        rd.title)        AS title,
  COALESCE(mua.summary,      rd.summary)      AS summary,
  COALESCE(mua.content,      rd.content)      AS content,
  COALESCE(mua.image_url,    rd.image_url)    AS image_url,
  COALESCE(NULLIF(mua.tags, '{}'), rd.tags)   AS tags,
  COALESCE(mua.category_id,  rd.category_id)  AS category_id,
  COALESCE(mua.geo_scope_id, rd.geo_scope_id) AS geo_scope_id,
  COALESCE(mua.ai_confidence, rd.ai_confidence) AS ai_confidence,
  rd.url,
  rd.language,
  rd.pub_date,
  mua.created_at,
  mua.updated_at
FROM media_unit_articles mua
JOIN raw_data rd ON rd.id = mua.raw_data_id;

COMMENT ON VIEW v_media_unit_articles IS 'النسخة الخاصة بالوحدة مدموجة مع الأصل (الوحدة تتغلّب، وإلا ترث من raw_data)';

-- ══════════════════════════════════════════════════════════════
-- 4. Backfill — تعبئة الجدول من editorial_queue الموجود حالياً
--    كل (raw_data_id, media_unit_id) موجود بالطابور = نسخة
-- ══════════════════════════════════════════════════════════════

INSERT INTO media_unit_articles
  (raw_data_id, media_unit_id, source_id, newsdesk_article_id,
   category_id, geo_scope_id, ai_confidence, ai_processed,
   status, is_incomplete, created_at, updated_at)
SELECT
  eq.raw_data_id,
  eq.media_unit_id,
  rd.source_id,
  rd.newsdesk_article_id,
  rd.category_id,
  rd.geo_scope_id,
  rd.ai_confidence,
  (rd.category_id IS NOT NULL) AS ai_processed,
  CASE
    WHEN eq.status = 'approved' THEN 'published'
    WHEN eq.status = 'incomplete' THEN 'pending'
    ELSE eq.status
  END AS status,
  COALESCE(rd.is_incomplete, false),
  eq.created_at,
  eq.updated_at
FROM editorial_queue eq
JOIN raw_data rd ON rd.id = eq.raw_data_id
WHERE eq.media_unit_id IS NOT NULL
  AND eq.raw_data_id IS NOT NULL
ON CONFLICT (raw_data_id, media_unit_id) DO NOTHING;
