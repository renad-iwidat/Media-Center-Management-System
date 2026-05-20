/**
 * Publishing System Database Migration (v2)
 * إنشاء جداول نظام النشر المتعدد المنصات
 * 
 * التحسينات:
 * - حالة "publishing" حقيقية في DB (يمنع double-click + race condition)
 * - retry_count + last_retry_at لإدارة إعادة المحاولات
 * - retry_attempt في logs لتتبع رقم المحاولة
 * - Advisory lock عبر pg_advisory_xact_lock لمنع race conditions
 * - فصل واضح: status = source of truth, logs = history
 */

import { query } from '../../config/database';

export async function runPublishingMigration(): Promise<void> {
  console.log('🔄 بدء migration نظام النشر المتعدد المنصات (v2)...');

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // 1. جدول إعدادات المنصات
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS platform_configs (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        credentials JSONB NOT NULL DEFAULT '{}',
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        media_unit_id INTEGER NOT NULL REFERENCES media_units(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT unique_platform_per_unit UNIQUE (platform, media_unit_id, name)
      );
    `);
    console.log('  ✅ جدول platform_configs');

    // ══════════════════════════════════════════════════════════════════════════
    // 2. جدول حالة النشر — SOURCE OF TRUTH
    //    status: 'publishing' | 'success' | 'failed'
    //    - publishing = قيد النشر (lock — يمنع double-click)
    //    - success = منشور بنجاح (يمنع التكرار)
    //    - failed = فشل (يسمح بإعادة المحاولة حسب retry_count)
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_status (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_config_id INTEGER NOT NULL REFERENCES platform_configs(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'publishing',
        external_post_id VARCHAR(255),
        external_url TEXT,
        published_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_retry_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- منع النشر المكرر: نفس المقال على نفس الإعداد
        CONSTRAINT unique_article_platform UNIQUE (article_id, platform_config_id)
      );
    `);
    console.log('  ✅ جدول publishing_status (source of truth)');

    // ══════════════════════════════════════════════════════════════════════════
    // 3. جدول سجل النشر — HISTORY / AUDIT TRAIL فقط
    //    كل محاولة نشر تُسجل هنا (حتى لو فشلت)
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS publishing_logs (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_config_id INTEGER NOT NULL REFERENCES platform_configs(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'processing',
        external_post_id VARCHAR(255),
        external_url TEXT,
        error_message TEXT,
        retry_attempt INTEGER NOT NULL DEFAULT 0,
        metadata JSONB,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('  ✅ جدول publishing_logs (audit trail)');

    // ══════════════════════════════════════════════════════════════════════════
    // 4. إضافة عمود publish_status على raw_data (lifecycle)
    //    يشمل حالة "publishing" كحالة حقيقية
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'raw_data' AND column_name = 'publish_status'
        ) THEN
          ALTER TABLE raw_data ADD COLUMN publish_status VARCHAR(30) DEFAULT 'draft';
        END IF;
      END $$;
    `);
    console.log('  ✅ عمود publish_status على raw_data');

    // ══════════════════════════════════════════════════════════════════════════
    // 5. إضافة أعمدة retry إذا مش موجودة (للتحديث من v1)
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'publishing_status' AND column_name = 'retry_count'
        ) THEN
          ALTER TABLE publishing_status ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
          ALTER TABLE publishing_status ADD COLUMN last_retry_at TIMESTAMP WITH TIME ZONE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'publishing_logs' AND column_name = 'retry_attempt'
        ) THEN
          ALTER TABLE publishing_logs ADD COLUMN retry_attempt INTEGER NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('  ✅ أعمدة retry');

    // ══════════════════════════════════════════════════════════════════════════
    // 6. Indexes للأداء
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE INDEX IF NOT EXISTS idx_publishing_status_article 
        ON publishing_status(article_id);
      CREATE INDEX IF NOT EXISTS idx_publishing_status_platform 
        ON publishing_status(platform);
      CREATE INDEX IF NOT EXISTS idx_publishing_status_status 
        ON publishing_status(status);
      CREATE INDEX IF NOT EXISTS idx_publishing_status_failed_retry
        ON publishing_status(status, retry_count) WHERE status = 'failed';
      CREATE INDEX IF NOT EXISTS idx_publishing_logs_article 
        ON publishing_logs(article_id);
      CREATE INDEX IF NOT EXISTS idx_publishing_logs_platform 
        ON publishing_logs(platform);
      CREATE INDEX IF NOT EXISTS idx_publishing_logs_attempted 
        ON publishing_logs(attempted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_platform_configs_platform 
        ON platform_configs(platform);
      CREATE INDEX IF NOT EXISTS idx_platform_configs_media_unit 
        ON platform_configs(media_unit_id);
      CREATE INDEX IF NOT EXISTS idx_raw_data_publish_status 
        ON raw_data(publish_status);
    `);
    console.log('  ✅ Indexes');

    console.log('✅ انتهى migration نظام النشر (v2) بنجاح');
  } catch (error) {
    console.error('❌ خطأ في migration نظام النشر:', error);
    throw error;
  }
}
