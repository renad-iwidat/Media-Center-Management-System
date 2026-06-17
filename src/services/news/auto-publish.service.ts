/**
 * Auto-Publish Service (Compatibility Layer)
 *
 * ⚠️ هذا الملف أصبح re-export فقط — الكود الفعلي في:
 *    ./auto-publish/
 *
 * يحافظ على التوافق مع الاستيرادات الموجودة:
 *   import { autoPublishService } from './auto-publish.service'
 *   import { AutoPublishTarget, ... } from './auto-publish.service'
 */

export {
  autoPublishService,
  AutoPublishTarget,
  AutoPublishArticle,
  AutoPublishResult,
  PublishResponse,
  PublishOverrides,
  targetRepository,
  publishLogger,
} from './auto-publish/index';
