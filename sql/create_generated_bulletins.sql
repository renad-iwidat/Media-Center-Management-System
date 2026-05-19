-- ============================================================
-- جدول الموجزات والنشرات المحفوظة
-- Generated Bulletins Table
-- يخزن الموجزات والنشرات التي يولدها النظام ويعدلها المحرر
-- ============================================================

CREATE TABLE IF NOT EXISTS generated_bulletins (
  id                  SERIAL PRIMARY KEY,
  media_unit_id       INTEGER NOT NULL REFERENCES media_units(id),
  type                VARCHAR(20) NOT NULL DEFAULT 'summary',   -- summary (موجز) / bulletin (نشرة)
  time_of_day         VARCHAR(20) NOT NULL DEFAULT 'morning',   -- morning (صباحي) / evening (مسائي)
  title               VARCHAR(500) NOT NULL DEFAULT '',          -- عنوان الموجز/النشرة
  original_content    TEXT NOT NULL,                             -- المحتوى الأصلي من AI
  edited_content      TEXT,                                      -- المحتوى بعد تعديل المحرر (null = لم يُعدّل)
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',      -- draft / published / archived
  news_count          INTEGER DEFAULT 0,                         -- عدد الأخبار المستخدمة
  word_count          INTEGER DEFAULT 0,                         -- عدد الكلمات
  created_by          INTEGER REFERENCES users(id),              -- المحرر الذي أنشأ
  updated_by          INTEGER REFERENCES users(id),              -- المحرر الذي عدّل
  audio_generated     BOOLEAN DEFAULT false,                     -- هل تم تحويله لصوت؟
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_bulletins_media_unit ON generated_bulletins(media_unit_id);
CREATE INDEX IF NOT EXISTS idx_generated_bulletins_type ON generated_bulletins(type);
CREATE INDEX IF NOT EXISTS idx_generated_bulletins_status ON generated_bulletins(status);
CREATE INDEX IF NOT EXISTS idx_generated_bulletins_created_at ON generated_bulletins(created_at DESC);
