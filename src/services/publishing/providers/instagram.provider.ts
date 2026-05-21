/**
 * Instagram Publishing Provider
 * مزود النشر على إنستغرام (Instagram Graph API)
 * 
 * ملاحظة: إنستغرام يتطلب صورة أو فيديو — لا يدعم المنشورات النصية فقط
 * 
 * Credentials المطلوبة:
 * - instagram_account_id: معرف حساب إنستغرام المهني
 * - access_token: Page Access Token (نفس توكن فيسبوك المرتبط)
 */

import { IPublishingProvider } from './base-provider';
import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';

export class InstagramProvider implements IPublishingProvider {
  readonly platformName = 'instagram';

  private readonly GRAPH_API_VERSION = 'v19.0';
  private readonly GRAPH_API_BASE = 'https://graph.facebook.com';

  async publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult> {
    try {
      const { instagram_account_id, access_token } = config.credentials;

      if (!instagram_account_id || !access_token) {
        return {
          success: false,
          platform: 'instagram',
          error: 'Missing instagram_account_id or access_token in credentials',
        };
      }

      // إنستغرام يتطلب صورة
      if (!article.image_url) {
        return {
          success: false,
          platform: 'instagram',
          error: 'Instagram requires an image. Article has no image_url.',
        };
      }

      const caption = article.isCustomContent
        ? article.content
        : this.formatCaption(article);

      // الخطوة 1: إنشاء media container
      const containerResponse = await fetch(
        `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${instagram_account_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: article.image_url,
            caption,
            access_token,
          }),
        }
      );

      const containerData = await containerResponse.json() as any;

      if (!containerResponse.ok || !containerData.id) {
        const errorMsg = containerData?.error?.message || `Container creation failed: HTTP ${containerResponse.status}`;
        return {
          success: false,
          platform: 'instagram',
          error: errorMsg,
          metadata: { step: 'create_container', response: containerData },
        };
      }

      const containerId = containerData.id;

      // الخطوة 2: نشر الـ container
      const publishResponse = await fetch(
        `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${instagram_account_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token,
          }),
        }
      );

      const publishData = await publishResponse.json() as any;

      if (publishResponse.ok && publishData.id) {
        const postId = publishData.id;
        // رابط المنشور على إنستغرام (تقريبي — الرابط الدقيق يحتاج permalink)
        const externalUrl = `https://www.instagram.com/p/${postId}/`;

        return {
          success: true,
          platform: 'instagram',
          external_post_id: postId,
          external_url: externalUrl,
          metadata: {
            container_id: containerId,
            response: publishData,
          },
        };
      } else {
        const errorMsg = publishData?.error?.message || `Publish failed: HTTP ${publishResponse.status}`;
        return {
          success: false,
          platform: 'instagram',
          error: errorMsg,
          metadata: { step: 'publish', response: publishData },
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: 'instagram',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateCredentials(config: PlatformConfig): Promise<boolean> {
    try {
      const { instagram_account_id, access_token } = config.credentials;
      if (!instagram_account_id || !access_token) return false;

      const response = await fetch(
        `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${instagram_account_id}?fields=id,username&access_token=${access_token}`
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * تنسيق الكابشن لإنستغرام (حد أقصى 2,200 حرف)
   */
  private formatCaption(article: ArticleForPublishing): string {
    const maxLength = 2000;
    let caption = `📰 ${article.title}\n\n`;

    const remainingSpace = maxLength - caption.length - 100; // مساحة للهاشتاقات
    const trimmedContent = article.content.length > remainingSpace
      ? article.content.substring(0, remainingSpace) + '...'
      : article.content;

    caption += trimmedContent;

    // إضافة الهاشتاقات
    if (article.tags && article.tags.length > 0) {
      const hashtags = article.tags
        .slice(0, 10)
        .map(tag => `#${tag.replace(/\s+/g, '_')}`)
        .join(' ');
      caption += `\n\n${hashtags}`;
    }

    return caption.substring(0, 2200);
  }
}
