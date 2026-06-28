/**
 * External Website Publishing Provider
 * مزود النشر على المواقع الخارجية (WordPress API)
 */

import { IPublishingProvider } from './base-provider';
import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';
import { prepareTagsString } from '../../news/auto-publish/tag-generator';

export class ExternalWebsiteProvider implements IPublishingProvider {
  readonly platformName = 'external_website';

  async publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult> {
    try {
      const { api_url, api_token, default_category_id } = config.credentials;

      if (!api_url || !api_token) {
        return { success: false, platform: 'external_website', error: 'Missing api_url or api_token in credentials' };
      }

      // تجهيز الـ tags (نفس منطق النشر التلقائي: تنظيف + توليد بالـ AI عند الفراغ)
      const tagsString = await prepareTagsString(
        article.tags,
        article.id,
        article.title,
        article.content
      );

      // بناء FormData
      const formData = new FormData();
      formData.append('title', article.title);
      formData.append('content', article.content);
      formData.append('category_id', default_category_id || '1');
      formData.append('tags', tagsString);
      formData.append('keywords', tagsString);

      // إضافة الصورة كـ base64 (image_url يسبب 500 على السيرفر الخارجي)
      if (article.image_url) {
        try {
          const imgResponse = await fetch(article.image_url, { signal: AbortSignal.timeout(15000) });
          if (imgResponse.ok) {
            const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
            const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
            const base64 = `data:${contentType};base64,${imgBuffer.toString('base64')}`;
            formData.append('image_base64', base64);
          }
        } catch { /* تجاهل — ننشر بدون صورة */ }
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
