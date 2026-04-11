/**
 * Database Types
 * أنواع البيانات والواجهات الإضافية
 */

/**
 * نتيجة الاستعلام
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * خيارات الاتصال
 */
export interface ConnectionOptions {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * حالات البيانات الخام
 */
export enum FetchStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  PROCESSED = 'processed',
}

/**
 * حالات طابور التحرير
 */
export enum QueueStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

/**
 * أنواع المصادر
 */
export enum SourceType {
  RSS = 'RSS',
  API = 'API',
  TELEGRAM = 'Telegram',
  WEB_SCRAPER = 'Web Scraper',
}

/**
 * نتيجة العملية
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * معلومات الصفحة
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * نتيجة مع الصفحات
 */
export interface PaginatedResult<T = any> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * خيارات الاستعلام
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * معلومات الخطأ
 */
export interface DatabaseError {
  code: string;
  message: string;
  detail?: string;
  hint?: string;
}
