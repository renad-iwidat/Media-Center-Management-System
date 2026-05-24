/**
 * Smart Transcription Editorial System - Database Migration
 * إنشاء جداول نظام التفريغ الذكي متعدد الجهات
 * 
 * الجداول:
 * 1. outlet_editorial_profiles — الهوية التحريرية لكل جهة
 * 2. transcription_output_types — أنواع المخرجات (تقرير، خبر، تفريغ، سوشال، مقاطع)
 * 3. social_media_platforms — منصات السوشال ميديا ومواصفاتها
 * 4. outlet_output_config — تخصيص المخرجات حسب الجهة
 * 5. angle_decision_rules — خريطة القرار لاختيار الزاوية
 * 6. quality_criteria — معايير الجودة والتحقق
 */

import { query } from '../../config/database';

export async function runTranscriptionEditorialMigration(): Promise<void> {
  console.log('🔄 بدء migration نظام التفريغ الذكي متعدد الجهات...');

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // 1. جدول الهوية التحريرية لكل جهة (Outlet Editorial Profiles)
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS outlet_editorial_profiles (
        id SERIAL PRIMARY KEY,
        media_unit_id INTEGER REFERENCES media_units(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        identity TEXT NOT NULL,
        angle_approach TEXT NOT NULL,
        tone_language TEXT NOT NULL,
        avoid_rules TEXT NOT NULL,
        news_style TEXT,
        report_style TEXT,
        transcript_style TEXT,
        social_media_style TEXT,
        clips_criteria TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ جدول outlet_editorial_profiles');

    // ══════════════════════════════════════════════════════════════════════════
    // 2. جدول أنواع مخرجات التفريغ الذكي
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS transcription_output_types (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name_ar VARCHAR(255) NOT NULL,
        description TEXT,
        default_prompt_template TEXT,
        is_required BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ جدول transcription_output_types');

    // ══════════════════════════════════════════════════════════════════════════
    // 3. جدول منصات السوشال ميديا ومواصفاتها
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS social_media_platforms (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) NOT NULL UNIQUE,
        name_ar VARCHAR(100) NOT NULL,
        max_length INTEGER,
        format_description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ جدول social_media_platforms');

    // ══════════════════════════════════════════════════════════════════════════
    // 4. جدول تخصيص المخرجات حسب الجهة
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS outlet_output_config (
        id SERIAL PRIMARY KEY,
        outlet_profile_id INTEGER NOT NULL REFERENCES outlet_editorial_profiles(id) ON DELETE CASCADE,
        output_type_id INTEGER NOT NULL REFERENCES transcription_output_types(id) ON DELETE CASCADE,
        custom_prompt_override TEXT,
        style_notes TEXT,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        CONSTRAINT unique_outlet_output UNIQUE (outlet_profile_id, output_type_id)
      );
    `);
    console.log('  ✅ جدول outlet_output_config');

    // ══════════════════════════════════════════════════════════════════════════
    // 5. جدول خريطة القرار لاختيار الزاوية
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS angle_decision_rules (
        id SERIAL PRIMARY KEY,
        content_indicator VARCHAR(255) NOT NULL,
        priority_action TEXT NOT NULL,
        recommended_outlet_ids JSONB NOT NULL DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ جدول angle_decision_rules');

    // ══════════════════════════════════════════════════════════════════════════
    // 6. جدول معايير الجودة والتحقق
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE TABLE IF NOT EXISTS quality_criteria (
        id SERIAL PRIMARY KEY,
        criterion_name VARCHAR(255) NOT NULL,
        check_question TEXT NOT NULL,
        possible_decisions JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('  ✅ جدول quality_criteria');

    // ══════════════════════════════════════════════════════════════════════════
    // 7. Indexes للأداء
    // ══════════════════════════════════════════════════════════════════════════
    await query(`
      CREATE INDEX IF NOT EXISTS idx_outlet_profiles_slug
        ON outlet_editorial_profiles(slug);
      CREATE INDEX IF NOT EXISTS idx_outlet_profiles_active
        ON outlet_editorial_profiles(is_active, sort_order);
      CREATE INDEX IF NOT EXISTS idx_outlet_profiles_media_unit
        ON outlet_editorial_profiles(media_unit_id);
      CREATE INDEX IF NOT EXISTS idx_transcription_output_types_slug
        ON transcription_output_types(slug);
      CREATE INDEX IF NOT EXISTS idx_outlet_output_config_outlet
        ON outlet_output_config(outlet_profile_id);
      CREATE INDEX IF NOT EXISTS idx_outlet_output_config_type
        ON outlet_output_config(output_type_id);
      CREATE INDEX IF NOT EXISTS idx_angle_rules_active
        ON angle_decision_rules(is_active, sort_order);
    `);
    console.log('  ✅ Indexes');

    console.log('✅ انتهى migration نظام التفريغ الذكي متعدد الجهات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في migration نظام التفريغ الذكي:', error);
    throw error;
  }
}
