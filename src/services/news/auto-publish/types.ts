/**
 * Auto-Publish Types
 * الأنواع والواجهات المستخدمة في نظام النشر التلقائي
 */

// ── Target (هدف النشر الخارجي) ──────────────────────────────────────────────

export interface AutoPublishTarget {
  id: number;
  media_unit_id: number;
  name: string;
  api_url: string;
  api_token: string;
  auth_type: 'bearer' | 'token';
  default_category_id: number;
  category_mappings: Record<string, number>;
  default_auto_publish: boolean;
  default_pin: number;
  categories_api_url: string | null;
  publish_mode: 'automated' | 'manual';
  manual_enabled: boolean;
  auto_enabled: boolean;
  is_enabled: boolean;
  daily_auto_limit: number | null;
  created_at: string;
  updated_at: string;
  media_unit_name?: string;
}

// ── Article (خبر جاهز للنشر) ────────────────────────────────────────────────

export interface AutoPublishArticle {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  category_id: number | null;
  category_slug: string | null;
  media_unit_id: number;
}

// ── Result (نتيجة عملية نشر) ────────────────────────────────────────────────

export interface AutoPublishResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: PublishDetail[];
}

export interface PublishDetail {
  articleId: number;
  targetId: number;
  targetName: string;
  title: string;
  status: 'success' | 'failed' | 'skipped';
  responseCode?: number;
  error?: string;
}

// ── Publish Response ─────────────────────────────────────────────────────────

export interface PublishResponse {
  success: boolean;
  responseCode?: number;
  error?: string;
  responseBody?: string;
  externalUrl?: string;
  externalId?: number;
}

// ── Overrides (إعدادات يختارها المحرر يدوياً) ───────────────────────────────

export interface PublishOverrides {
  category_id?: number;
  auto_publish?: boolean;
  pin?: number;
  isManual?: boolean;
  // نص معدّل من المحرر قبل النشر الفعلي (يتجاوز نص الخبر المخزّن)
  title?: string;
  content?: string;
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface TargetStats {
  id: number;
  name: string;
  mediaUnitName: string;
  isEnabled: boolean;
  manualEnabled: boolean;
  autoEnabled: boolean;
  defaultAutoPublish: boolean;
  defaultPin: number;
  authType: string;
  dailyAutoLimit: number | null;
  totalPublished: number;
  totalFailed: number;
  publishedToday: number;
  lastPublishedAt: string | null;
}

export interface AutoPublishStats {
  masterEnabled: boolean;
  targets: TargetStats[];
}

// ── Target Create/Update DTOs ────────────────────────────────────────────────

export interface CreateTargetDTO {
  media_unit_id: number;
  name: string;
  api_url: string;
  api_token: string;
  auth_type?: 'bearer' | 'token';
  default_category_id?: number;
  category_mappings?: Record<string, number>;
  default_auto_publish?: boolean;
  default_pin?: number;
  categories_api_url?: string;
  publish_mode?: 'automated' | 'manual';
  manual_enabled?: boolean;
  auto_enabled?: boolean;
  is_enabled?: boolean;
}

export interface UpdateTargetDTO {
  name?: string;
  api_url?: string;
  api_token?: string;
  auth_type?: 'bearer' | 'token';
  default_category_id?: number;
  category_mappings?: Record<string, number>;
  default_auto_publish?: boolean;
  default_pin?: number;
  categories_api_url?: string;
  publish_mode?: 'automated' | 'manual';
  manual_enabled?: boolean;
  auto_enabled?: boolean;
  is_enabled?: boolean;
  daily_auto_limit?: number | null;
}

// ── External Category ────────────────────────────────────────────────────────

export interface ExternalCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: { id: number; title: string }[];
}
