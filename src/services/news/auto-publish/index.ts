/**
 * Auto-Publish Module
 * نظام النشر التلقائي على المواقع الخارجية
 *
 * البنية:
 * ├── types.ts              — الأنواع والواجهات
 * ├── category-resolver.ts  — تحديد التصنيف الخارجي
 * ├── tag-generator.ts      — توليد الكلمات المفتاحية
 * ├── content-formatter.ts  — تنظيف وتنسيق المحتوى
 * ├── publish-logger.ts     — تسجيل عمليات النشر
 * ├── target-repository.ts  — CRUD أهداف النشر
 * └── auto-publish.service.ts — التنسيق الرئيسي
 */

// الخدمة الرئيسية
export { autoPublishService } from './auto-publish.service';

// الأنواع
export type {
  AutoPublishTarget,
  AutoPublishArticle,
  AutoPublishResult,
  PublishDetail,
  PublishResponse,
  PublishOverrides,
  TargetStats,
  AutoPublishStats,
  CreateTargetDTO,
  UpdateTargetDTO,
  ExternalCategory,
} from './types';

// الموديولات الفرعية (للاستخدام المباشر عند الحاجة)
export { targetRepository } from './target-repository';
export { publishLogger } from './publish-logger';
export { resolveExternalCategory } from './category-resolver';
export { prepareTagsString, generateAndSaveTags } from './tag-generator';
export {
  sanitizeForExternal,
  removePromoContent,
  formatAsHtml,
  prepareContentForPublish,
  prepareTitleForPublish,
} from './content-formatter';
