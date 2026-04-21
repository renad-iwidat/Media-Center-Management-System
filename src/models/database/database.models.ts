/**
 * Database Models
 * تعريفات الجداول والواجهات
 */

// SourceType - أنواع المصادر
export interface SourceType {
  id: number;
  name: string; // RSS / API / Telegram / Web Scraper
}

// Source - المصادر الفعلية
export interface Source {
  id: number;
  source_type_id: number;
  url: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  default_category_id: number;
  last_fetched_at: Date | null;
}

// Category - التصنيفات
export interface Category {
  id: number;
  name: string;
  slug: string;
  flow: string;
  is_active: boolean;
}

// RawData - البيانات الخام
export interface RawData {
  id: number;
  source_id: number;
  source_type_id: number;
  category_id: number | null;
  url: string;
  title: string;
  content: string;
  image_url: string;
  tags: string[];
  fetch_status: string;
  fetched_at: Date;
  pub_date: Date | null;  // تاريخ نشر الخبر على الموقع الأصلي
}

// EditorialPolicy - سياسات التحرير
export interface EditorialPolicy {
  id: number;
  media_unit_id: number;
  name: string;
  description: string;
  rules: string;
  is_active: boolean;
  created_at: Date;
}

// EditorialQueue - طابور التحرير
export interface EditorialQueue {
  id: number;
  media_unit_id: number;
  raw_data_id: number;
  policy_id: number;
  status: string;
  editor_notes: string;
  created_at: Date;
  updated_at: Date;
}

// PublishedItem - المحتوى المنشور
export interface PublishedItem {
  id: number;
  media_unit_id: number;
  raw_data_id: number;
  queue_id: number;
  content_type_id: number;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  published_at: Date;
}
