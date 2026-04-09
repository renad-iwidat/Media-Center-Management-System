/**
 * News Types
 * أنواع البيانات الخاصة بالأخبار
 */

/**
 * مقالة RSS
 */
export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

/**
 * نتيجة سحب RSS
 */
export interface RSSFetchResult {
  source: any;
  article: RSSArticle | null;
  error: string | null;
}

/**
 * نتيجة التخزين
 */
export interface StorageResult {
  timestamp: string;
  totalSources: number;
  successCount: number;
  failureCount: number;
  data: RSSFetchResult[];
}

/**
 * حالات سحب الأخبار
 */
export enum NewsStatus {
  PENDING = 'pending',
  FETCHING = 'fetching',
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
}

/**
 * معلومات مصدر الأخبار
 */
export interface NewsSource {
  id: number;
  name: string;
  url: string;
  type: string;
  isActive: boolean;
  lastFetch?: Date;
}

/**
 * خيارات السحب
 */
export interface FetchOptions {
  limit?: number;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
