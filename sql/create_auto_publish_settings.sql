-- ============================================================
-- Auto-Publish Targets Table
-- جدول أهداف النشر التلقائي — كل وحدة إعلامية ممكن يكون عندها
-- موقع خارجي واحد أو أكثر تنشر عليه تلقائياً
-- ============================================================

CREATE TABLE IF NOT EXISTS auto_publish_targets (
  id                  SERIAL PRIMARY KEY,
  media_unit_id       INTEGER NOT NULL REFERENCES media_units(id),
  name                VARCHAR(255) NOT NULL,           -- اسم الهدف (مثلاً: "موقع هنا غزة")
  api_url             TEXT NOT NULL,                   -- رابط API النشر
  api_token           TEXT NOT NULL,                   -- Bearer Token
  default_category_id INTEGER DEFAULT 1,              -- التصنيف الافتراضي على الموقع الخارجي
  is_enabled          BOOLEAN DEFAULT false,           -- تفعيل/إيقاف النشر لهذا الهدف
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Auto-Publish Log Table
-- سجل النشر التلقائي — لتتبع ما تم نشره وما فشل لكل هدف
-- ============================================================

CREATE TABLE IF NOT EXISTS auto_publish_log (
  id              SERIAL PRIMARY KEY,
  target_id       INTEGER NOT NULL REFERENCES auto_publish_targets(id),
  raw_data_id     INTEGER NOT NULL REFERENCES raw_data(id),
  published_at    TIMESTAMP DEFAULT NOW(),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, success, failed
  external_url    TEXT,                                     -- رابط الخبر على الموقع الخارجي
  external_id     INTEGER,                                 -- ID الخبر على الموقع الخارجي
  response_code   INTEGER,
  response_body   TEXT,
  error_message   TEXT,
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_publish_targets_media_unit ON auto_publish_targets(media_unit_id);
CREATE INDEX IF NOT EXISTS idx_auto_publish_log_target_id ON auto_publish_log(target_id);
CREATE INDEX IF NOT EXISTS idx_auto_publish_log_raw_data_id ON auto_publish_log(raw_data_id);
CREATE INDEX IF NOT EXISTS idx_auto_publish_log_status ON auto_publish_log(status);

-- ============================================================
-- إعداد عام للنشر التلقائي (master switch)
-- ============================================================
INSERT INTO system_settings (key, value, description) VALUES
  ('auto_publish_enabled', 'false', 'تشغيل/إيقاف النشر التلقائي على المواقع الخارجية (master switch)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- إدراج هدف "هنا غزة" — الوحدة الإعلامية "هنا غزة"
-- ============================================================
-- Category Mapping (محلي → هنا غزة):
--   1  محلي              →  1  الأخبار المحلية
--   2  دولي              →  4  الأخبار الدولية
--   3  اقتصاد            →  6  الاقتصاد
--   4  رياضة             →  7  الرياضة
--   5  صحة               →  2  الصحة
--   6  علوم وتكنولوجيا   →  8  تكنولوجيا
--   7  فن و ثقافة        →  9  الثقافة
--   9  بيئة              →  10 اجتماعي
--   10 غذاء              →  13 أخبار عامة
--   11 سياسي             →  5  السياسة
-- ============================================================
INSERT INTO auto_publish_targets (media_unit_id, name, api_url, api_token, default_category_id, is_enabled)
SELECT 
  mu.id,
  'موقع هنا غزة',
  'https://hgaza.nn.ps/api/v1/automation/news',
  '<HGAZA_API_TOKEN>',  -- ضع القيمة الحقيقية هنا أو في .env
  1,
  false
FROM media_units mu
WHERE mu.name = 'هنا غزة'
ON CONFLICT DO NOTHING;

-- ============================================================
-- إدراج هدف "موقع النجاح" — الوحدة الإعلامية "النجاح"
-- ============================================================
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
-- ============================================================
INSERT INTO auto_publish_targets (media_unit_id, name, api_url, api_token, default_category_id, is_enabled)
SELECT 
  mu.id,
  'موقع النجاح',
  'https://nn.najah.edu/api/v1/news/article/',
  '<NAJAH_API_TOKEN>',  -- ضع القيمة الحقيقية هنا أو في .env
  12,
  false
FROM media_units mu
WHERE mu.name = 'النجاح'
ON CONFLICT DO NOTHING;
