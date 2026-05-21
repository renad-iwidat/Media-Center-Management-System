/**
 * Publishing System Types
 * أنواع نظام النشر المتعدد المنصات
 */

// ── Supported Platforms ─────────────────────────────────────────────────────

export type PublishingPlatform = 
  | 'external_website'
  | 'facebook'
  | 'instagram'
  | 'twitter';

// ── Article Status Lifecycle ────────────────────────────────────────────────

export type ArticlePublishStatus =
  | 'draft'
  | 'ready_for_publish'
  | 'publishing'          // ← حالة حقيقية: قيد النشر (يمنع double-click)
  | 'published_social'
  | 'published_external'
  | 'archived';

// ── Publishing Status (per platform) ────────────────────────────────────────
// publishing_status = source of truth للحالة الحالية

export type PublishStatusValue = 'publishing' | 'success' | 'failed';

// ── Publishing Log Status ───────────────────────────────────────────────────
// publishing_logs = history فقط (audit trail)

export type PublishLogStatus = 'processing' | 'success' | 'failed';

// ── Retry Configuration ─────────────────────────────────────────────────────

export interface RetryConfig {
  max_retries: number;
  base_delay_ms: number;    // exponential backoff base
  max_delay_ms: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  max_retries: 3,
  base_delay_ms: 2000,      // 2s, 4s, 8s
  max_delay_ms: 30000,      // حد أقصى 30 ثانية
};

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface PlatformConfig {
  id: number;
  platform: PublishingPlatform;
  name: string;
  credentials: Record<string, string>;
  is_enabled: boolean;
  media_unit_id: number;
  created_at: string;
  updated_at: string;
}

export interface PublishingStatus {
  id: number;
  article_id: number;
  platform: PublishingPlatform;
  platform_config_id: number;
  status: PublishStatusValue;
  external_post_id: string | null;
  external_url: string | null;
  published_at: string | null;
  error_message: string | null;
  retry_count: number;
  last_retry_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PublishingLog {
  id: number;
  article_id: number;
  platform: PublishingPlatform;
  platform_config_id: number;
  status: PublishLogStatus;
  external_post_id: string | null;
  external_url: string | null;
  error_message: string | null;
  retry_attempt: number;
  metadata: Record<string, any> | null;
  attempted_at: string;
  completed_at: string | null;
}

export interface PublishRequest {
  article_id: number;
  platform: PublishingPlatform;
  platform_config_id: number;
}

export interface PublishResult {
  success: boolean;
  platform: PublishingPlatform;
  external_post_id?: string;
  external_url?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ArticleForPublishing {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  category_id: number | null;
  category_name: string | null;
  media_unit_id: number;
  /** إذا true — المحتوى جاهز للنشر مباشرة (من SocialPostCreator) بدون formatting إضافي */
  isCustomContent?: boolean;
}

export interface PlatformPublishOptions {
  article: ArticleForPublishing;
  config: PlatformConfig;
}

/**
 * Platform-specific constraints
 * قيود كل منصة — تُفحص قبل محاولة النشر
 */
export interface PlatformConstraints {
  requires_image: boolean;
  requires_business_account: boolean;
  max_content_length: number;
  supported_media_types: string[];
  notes: string[];
}

export const PLATFORM_CONSTRAINTS: Record<PublishingPlatform, PlatformConstraints> = {
  external_website: {
    requires_image: false,
    requires_business_account: false,
    max_content_length: 100000,
    supported_media_types: ['text', 'image'],
    notes: ['يدعم WordPress REST API أو أي API مخصص'],
  },
  facebook: {
    requires_image: false,
    requires_business_account: false,
    max_content_length: 63206,
    supported_media_types: ['text', 'image', 'link'],
    notes: ['يتطلب Page Access Token (long-lived)', 'يدعم نص فقط أو نص + صورة'],
  },
  instagram: {
    requires_image: true,
    requires_business_account: true,
    max_content_length: 2200,
    supported_media_types: ['image', 'video'],
    notes: [
      'يتطلب Instagram Business/Creator Account',
      'يتطلب صورة أو فيديو إجبارياً — لا يدعم نص فقط',
      'الصورة لازم تكون URL عام (publicly accessible)',
      'الحساب لازم يكون مربوط بصفحة فيسبوك',
    ],
  },
  twitter: {
    requires_image: false,
    requires_business_account: false,
    max_content_length: 280,
    supported_media_types: ['text', 'image'],
    notes: ['يتطلب OAuth 1.0a credentials', 'حد 280 حرف للتغريدة'],
  },
};
