/**
 * Base Publishing Provider (Strategy Pattern)
 * الواجهة الأساسية لكل مزود نشر
 * 
 * كل منصة جديدة تحتاج تنفذ هذه الواجهة فقط
 */

import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';

export interface IPublishingProvider {
  /** اسم المنصة */
  readonly platformName: string;

  /**
   * نشر مقال على المنصة
   */
  publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult>;

  /**
   * التحقق من صلاحية الاعتمادات (credentials)
   */
  validateCredentials(config: PlatformConfig): Promise<boolean>;

  /**
   * حذف منشور من المنصة (اختياري)
   */
  unpublish?(externalPostId: string, config: PlatformConfig): Promise<boolean>;
}
