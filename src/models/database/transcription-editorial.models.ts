/**
 * Transcription Editorial System Models
 * تعريفات جداول نظام التفريغ الذكي متعدد الجهات
 */

// ── الهوية التحريرية لكل جهة ────────────────────────────────────────────────

export interface OutletEditorialProfile {
  id: number;
  media_unit_id: number | null;
  name: string;
  slug: string;
  identity: string;
  angle_approach: string;
  tone_language: string;
  avoid_rules: string;
  news_style: string | null;
  report_style: string | null;
  transcript_style: string | null;
  social_media_style: string | null;
  clips_criteria: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ── أنواع مخرجات التفريغ الذكي ──────────────────────────────────────────────

export interface TranscriptionOutputType {
  id: number;
  slug: string;
  name_ar: string;
  description: string | null;
  default_prompt_template: string | null;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type TranscriptionOutputSlug =
  | 'comprehensive_report'
  | 'short_news'
  | 'full_transcript'
  | 'social_posts'
  | 'video_clips';

// ── منصات السوشال ميديا ──────────────────────────────────────────────────────

export interface SocialMediaPlatform {
  id: number;
  slug: string;
  name_ar: string;
  max_length: number | null;
  format_description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
}

export type SocialMediaPlatformSlug =
  | 'facebook'
  | 'x'
  | 'instagram'
  | 'tiktok_reels'
  | 'linkedin'
  | 'whatsapp_telegram';

// ── تخصيص المخرجات حسب الجهة ────────────────────────────────────────────────

export interface OutletOutputConfig {
  id: number;
  outlet_profile_id: number;
  output_type_id: number;
  custom_prompt_override: string | null;
  style_notes: string | null;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── خريطة القرار لاختيار الزاوية ────────────────────────────────────────────

export interface AngleDecisionRule {
  id: number;
  content_indicator: string;
  priority_action: string;
  recommended_outlet_ids: string[];  // slugs of outlets
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

// ── معايير الجودة والتحقق ────────────────────────────────────────────────────

export interface QualityCriterion {
  id: number;
  criterion_name: string;
  check_question: string;
  possible_decisions: string[];
  is_active: boolean;
  sort_order: number;
  created_at: Date;
}
