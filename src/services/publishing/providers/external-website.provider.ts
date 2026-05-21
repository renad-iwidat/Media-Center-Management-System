/**
 * External Website Publishing Provider
 * مزود النشر على المواقع الخارجية (WordPress API)
 */

import { IPublishingProvider } from './base-provider';
import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';

export class ExternalWebsiteProvider implements IPublishingProvider {
  readonly platformName = 'external_website';

  async publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult> {
    try {
      const { api_url, api_token, default_category_id } = config.credentials;

      if (!api_url || !api_token) {
        return { success: false, platform: 'external_website', error: 'Missing api_url or api_token in credentials' };
      }

      // تجهيز الـ tags
      const tagsString = Array.isArray(article.tags) ? article.tags.join(',') : '';

      // بناء FormData
      const formData = new FormData();
      formData.append('title', article.title);
      formData.append('content', article.content);
      formData.append('category_id', default_category_id || '1');
      formData.append('tags', tagsString);
      formData.append('keywords', tagsString);

      if (article.image_url) {
        formData.append('image_url', article.image_url);
      }

      // إرسال الطلب (FormData يضبط Content-Type + boundary تلقائياً)
      const response = await fetch(api_url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${api_token}`,
        },
        body: formData,
      });

      const responseBody = await response.text();

      if (response.ok) {
        let externalId: string | undefined;
        let externalUrl: string | undefined;

        try {
          const parsed = JSON.parse(responseBody);
          externalId = parsed?.data?.id?.toString();
          externalUrl = parsed?.data?.url;
          if (!externalUrl && externalId) {
            const baseUrl = api_url.replace('/api/v1/automation/news', '');
            externalUrl = `${baseUrl}/news/${externalId}`;
          }
        } catch { /* ignore parse errors */ }

        return {
          success: true,
          platform: 'external_website',
          external_post_id: externalId,
          external_url: externalUrl,
          metadata: { response_code: response.status },
        };
      } else {
        return {
          success: false,
          platform: 'external_website',
          error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
          metadata: { response_code: response.status },
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: 'external_website',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateCredentials(config: PlatformConfig): Promise<boolean> {
    const { api_url, api_token } = config.credentials;
    return !!(api_url && api_token);
  }
}
