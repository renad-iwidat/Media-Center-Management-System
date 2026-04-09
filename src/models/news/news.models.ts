/**
 * News Models
 * نماذج البيانات الخاصة بالأخبار
 */

/**
 * مقالة خام من RSS
 */
export interface RawNewsArticle {
  id?: number;
  sourceId: number;
  sourceTypeId: number;
  categoryId: number;
  url: string;
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  fetchStatus: string;
  fetchedAt?: Date;
}

/**
 * مقالة معالجة
 */
export interface ProcessedNewsArticle {
  id?: number;
  rawDataId: number;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  keywords: string[];
  sentiment?: string;
  processedAt?: Date;
}

/**
 * مقالة منشورة
 */
export interface PublishedNewsArticle {
  id?: number;
  mediaUnitId: number;
  rawDataId: number;
  queueId: number;
  title: string;
  content: string;
  tags: string[];
  isActive: boolean;
  publishedAt?: Date;
  viewCount?: number;
  shareCount?: number;
}

/**
 * إحصائيات الأخبار
 */
export interface NewsStatistics {
  totalArticles: number;
  successfulFetches: number;
  failedFetches: number;
  averageFetchTime: number;
  lastFetchTime?: Date;
  articlesPerSource: Record<string, number>;
}
