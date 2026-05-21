/**
 * Twitter/X Publishing Provider
 * مزود النشر على تويتر/إكس (Twitter API v2)
 * 
 * Credentials المطلوبة:
 * - api_key: Consumer API Key
 * - api_secret: Consumer API Secret
 * - access_token: Access Token
 * - access_token_secret: Access Token Secret
 * - bearer_token: Bearer Token (للقراءة فقط)
 * 
 * ملاحظة: النشر يتطلب OAuth 1.0a — هنا نستخدم Bearer Token مع API v2
 * في الإنتاج يُفضل استخدام مكتبة مثل twitter-api-v2
 */

import { IPublishingProvider } from './base-provider';
import { ArticleForPublishing, PlatformConfig, PublishResult } from '../types';
import crypto from 'crypto';

export class TwitterProvider implements IPublishingProvider {
  readonly platformName = 'twitter';

  private readonly API_BASE = 'https://api.twitter.com/2';

  async publish(article: ArticleForPublishing, config: PlatformConfig): Promise<PublishResult> {
    try {
      const { api_key, api_secret, access_token, access_token_secret } = config.credentials;

      if (!api_key || !api_secret || !access_token || !access_token_secret) {
        return {
          success: false,
          platform: 'twitter',
          error: 'Missing Twitter OAuth credentials (api_key, api_secret, access_token, access_token_secret)',
        };
      }

      // تنسيق التغريدة (حد أقصى 280 حرف)
      const tweetText = article.isCustomContent
        ? article.content.substring(0, 280)
        : this.formatTweet(article);

      // بناء OAuth 1.0a header
      const url = `${this.API_BASE}/tweets`;
      const oauthHeader = this.buildOAuthHeader(
        'POST',
        url,
        { api_key, api_secret, access_token, access_token_secret }
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': oauthHeader,
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const responseData = await response.json() as any;

      if (response.ok && responseData?.data?.id) {
        const tweetId = responseData.data.id;
        // استخراج username من الـ config أو بناء رابط عام
        const username = config.credentials.username || '';
        const externalUrl = username
          ? `https://x.com/${username}/status/${tweetId}`
          : `https://x.com/i/web/status/${tweetId}`;

        return {
          success: true,
          platform: 'twitter',
          external_post_id: tweetId,
          external_url: externalUrl,
          metadata: { tweet_text: tweetText, response: responseData },
        };
      } else {
        const errorMsg = responseData?.detail || responseData?.errors?.[0]?.message || `HTTP ${response.status}`;
        return {
          success: false,
          platform: 'twitter',
          error: errorMsg,
          metadata: { response: responseData },
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: 'twitter',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateCredentials(config: PlatformConfig): Promise<boolean> {
    try {
      const { bearer_token } = config.credentials;
      if (!bearer_token) return false;

      // التحقق عبر endpoint بسيط
      const response = await fetch(`${this.API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${bearer_token}` },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async unpublish(externalPostId: string, config: PlatformConfig): Promise<boolean> {
    try {
      const { api_key, api_secret, access_token, access_token_secret } = config.credentials;
      const url = `${this.API_BASE}/tweets/${externalPostId}`;
      const oauthHeader = this.buildOAuthHeader(
        'DELETE',
        url,
        { api_key, api_secret, access_token, access_token_secret }
      );

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': oauthHeader },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * تنسيق التغريدة (280 حرف كحد أقصى)
   */
  private formatTweet(article: ArticleForPublishing): string {
    const maxLength = 280;
    let tweet = '';

    // العنوان أولاً
    const title = article.title.length > 200
      ? article.title.substring(0, 197) + '...'
      : article.title;

    tweet = `📰 ${title}`;

    // إضافة هاشتاقات إذا في مساحة
    if (article.tags && article.tags.length > 0) {
      const hashtags = article.tags
        .slice(0, 3)
        .map(tag => `#${tag.replace(/\s+/g, '_')}`)
        .join(' ');

      if (tweet.length + hashtags.length + 2 <= maxLength) {
        tweet += `\n\n${hashtags}`;
      }
    }

    return tweet.substring(0, maxLength);
  }

  /**
   * بناء OAuth 1.0a Authorization Header
   * (تنفيذ مبسط — في الإنتاج استخدم مكتبة oauth-1.0a)
   */
  private buildOAuthHeader(
    method: string,
    url: string,
    credentials: { api_key: string; api_secret: string; access_token: string; access_token_secret: string }
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: credentials.api_key,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: credentials.access_token,
      oauth_version: '1.0',
    };

    // بناء الـ signature base string
    const sortedParams = Object.entries(oauthParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(credentials.api_secret)}&${encodeURIComponent(credentials.access_token_secret)}`;

    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    oauthParams['oauth_signature'] = signature;

    // بناء الـ header
    const headerString = Object.entries(oauthParams)
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(', ');

    return `OAuth ${headerString}`;
  }
}
