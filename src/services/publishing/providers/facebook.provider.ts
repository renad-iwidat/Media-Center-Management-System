/**
 * Facebook Publishing Provider
 * مزود النشر على فيسبوك (Facebook Graph API)
 * 
 * Credentials المطلوبة:
 * - page_id: معرف صفحة فيسبوك
 * - access_token: Page Access Token (long-lived)
 */

import { IPublishingProvider } from './base-provider';
import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';
import { environment } from '../../../config/environment';

export class FacebookProvider implements IPublishingProvider {
  readonly platformName = 'facebook';

  private readonly GRAPH_API_VERSION = 'v19.0';
  private readonly GRAPH_API_BASE = 'https://graph.facebook.com';

  async publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult> {
    try {
      // الاعتمادات من الإعدادات أو من env كـ fallback
      const page_id = config.credentials.page_id || environment.FACEBOOK_PAGE_ID;
      const access_token = config.credentials.access_token || environment.FACEBOOK_ACCESS_TOKEN;

      if (!page_id || !access_token) {
        return {
          success: false,
          platform: 'facebook',
          error: 'Missing page_id or access_token in credentials',
        };
      }

      // بناء محتوى المنشور
      // إذا المحتوى مخصص (من SocialPostCreator) — نستخدمه مباشرة بدون formatting
      const postMessage = article.isCustomContent
        ? article.content
        : this.formatPostContent(article);

      // تحديد نوع المنشور (مع صورة أو بدون)
      let endpoint: string;
      let requestBody: Record<string, string>;

      if (article.image_url) {
        // منشور مع صورة
        endpoint = `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${page_id}/photos`;
        requestBody = {
          url: article.image_url,
          caption: postMessage,
          access_token,
        };
      } else {
        // منشور نصي فقط
        endpoint = `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${page_id}/feed`;
        requestBody = {
          message: postMessage,
          access_token,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData.id) {
        const postId = responseData.id;
        const externalUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;

        return {
          success: true,
          platform: 'facebook',
          external_post_id: postId,
          external_url: externalUrl,
          metadata: {
            post_type: article.image_url ? 'photo' : 'text',
            response: responseData,
          },
        };
      } else {
        const errorMsg = responseData?.error?.message || `HTTP ${response.status}`;
        return {
          success: false,
          platform: 'facebook',
          error: errorMsg,
          metadata: { response: responseData },
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: 'facebook',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateCredentials(config: PlatformConfig): Promise<boolean> {
    try {
      const page_id = config.credentials.page_id || environment.FACEBOOK_PAGE_ID;
      const access_token = config.credentials.access_token || environment.FACEBOOK_ACCESS_TOKEN;
      if (!page_id || !access_token) return false;

      // التحقق من صلاحية التوكن عبر طلب بسيط
      const response = await fetch(
        `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${page_id}?fields=id,name&access_token=${access_token}`
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  async unpublish(externalPostId: string, config: PlatformConfig): Promise<boolean> {
    try {
      const access_token = config.credentials.access_token || environment.FACEBOOK_ACCESS_TOKEN;
      const response = await fetch(
        `${this.GRAPH_API_BASE}/${this.GRAPH_API_VERSION}/${externalPostId}?access_token=${access_token}`,
        { method: 'DELETE' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * تنسيق محتوى المنشور لفيسبوك
   */
  private formatPostContent(article: ArticleForPublishing): string {
    let content = `📰 ${article.title}\n\n`;

    // اقتطاع المحتوى (فيسبوك يدعم حتى 63,206 حرف)
    const maxContentLength = 500;
    const trimmedContent = article.content.length > maxContentLength
      ? article.content.substring(0, maxContentLength) + '...'
      : article.content;

    content += trimmedContent;

    // إضافة الهاشتاقات
    if (article.tags && article.tags.length > 0) {
      const hashtags = article.tags
        .slice(0, 5)
        .map(tag => `#${tag.replace(/\s+/g, '_')}`)
        .join(' ');
      content += `\n\n${hashtags}`;
    }

    return content;
  }
}
