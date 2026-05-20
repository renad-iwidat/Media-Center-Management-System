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

      // بناء multipart/form-data
      const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
      let body = '';

      const addField = (name: string, value: string) => {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
        body += `${value}\r\n`;
      };

      addField('title', article.title);
      addField('content', article.content);
      addField('category_id', default_category_id || '1');
      addField('tags', tagsString);
      addField('keywords', tagsString);

      if (article.image_url) {
        addField('image_url', article.image_url);
      }

      body += `--${boundary}--\r\n`;

      // إرسال الطلب
      const response = await fetch(api_url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${api_token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
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
