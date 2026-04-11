/**
 * RSS Fetcher Service
 * 
 * مسؤول عن سحب الأخبار من مصادر RSS المختلفة
 * وتحويلها إلى صيغة موحدة
 */

import Parser from 'rss-parser';

/**
 * واجهة لتمثيل مصدر RSS
 */
export interface RSSSource {
  id: number;
  name: string;
  url: string;
  source_type_id: number;
  default_category_id: number;
}

/**
 * واجهة لتمثيل مقالة RSS
 */
export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  image_url?: string;
  tags?: string[];
}

/**
 * واجهة لنتيجة سحب RSS
 */
export interface RSSFetchResult {
  source: RSSSource;
  article: RSSArticle | null;
  error: string | null;
}

/**
 * فئة RSS Fetcher Service
 * تتعامل مع سحب وتحليل بيانات RSS
 */
class RSSFetcherService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  /**
   * تنظيف وصف المقالة من HTML tags
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '') // حذف HTML tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '') // حذف HTML entities
      .trim();
  }

  /**
   * استخراج صورة المقالة من جميع الصيغ الممكنة (أول صورة فقط)
   */
  private extractImageUrl(item: any): string {
    // 1. البحث عن media:content (أول صورة)
    if (item.media && Array.isArray(item.media) && item.media.length > 0) {
      return item.media[0].url || '';
    }

    // 2. البحث عن mediaContent (أول صورة)
    if (item.mediaContent && Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
      return item.mediaContent[0].url || '';
    }

    // 3. البحث عن enclosure (للـ podcasts والصور)
    if (item.enclosure && item.enclosure.url) {
      if (!item.enclosure.type || item.enclosure.type.startsWith('image/')) {
        return item.enclosure.url;
      }
    }

    // 4. البحث عن media:thumbnail في الـ link (أول صورة)
    if (item.link && typeof item.link === 'object' && Array.isArray(item.link)) {
      for (const link of item.link) {
        if (link['media:content'] && link['media:content']['media:thumbnail']) {
          const thumbnails = link['media:content']['media:thumbnail'];
          if (Array.isArray(thumbnails) && thumbnails.length > 0) {
            // اختر أول صورة (الأكبر حجماً)
            const largest = thumbnails.reduce((max: any, current: any) => {
              const maxSize = (max.width || 0) * (max.height || 0);
              const currentSize = (current.width || 0) * (current.height || 0);
              return currentSize > maxSize ? current : max;
            });
            if (largest.url) return largest.url;
          } else if (thumbnails && thumbnails.url) {
            return thumbnails.url;
          }
        }
      }
    }

    // 5. البحث عن image في الـ content (أول صورة)
    if (item.content) {
      const imageMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imageMatch) {
        return imageMatch[1];
      }
    }

    // 6. البحث عن image في الـ summary (أول صورة)
    if (item.summary) {
      const imageMatch = item.summary.match(/<img[^>]+src="([^">]+)"/);
      if (imageMatch) {
        return imageMatch[1];
      }
    }

    // 7. البحث عن dc:image
    if (item['dc:image']) {
      return item['dc:image'];
    }

    // 8. البحث عن image في الـ description (أول صورة)
    if (item.description) {
      const imageMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
      if (imageMatch) {
        return imageMatch[1];
      }
    }

    return '';
  }

  /**
   * استخراج الـ tags من المقالة
   */
  private extractTags(item: any): string[] {
    const tags: string[] = [];

    // البحث عن categories
    if (item.categories && Array.isArray(item.categories)) {
      tags.push(...item.categories.map((cat: any) => 
        typeof cat === 'string' ? cat : cat.name || ''
      ).filter((t: string) => t));
    }

    // البحث عن keywords في الـ content
    if (item.content) {
      const keywordMatch = item.content.match(/<meta\s+name="keywords"\s+content="([^"]+)"/);
      if (keywordMatch) {
        const keywords = keywordMatch[1].split(',').map((k: string) => k.trim());
        tags.push(...keywords);
      }
    }

    return [...new Set(tags)]; // إزالة التكرار
  }

  /**
   * تنظيف الرابط من HTML encoding
   */
  private cleanLink(link: string): string {
    try {
      return decodeURIComponent(link).replace(/<[^>]*>/g, '').trim();
    } catch {
      return link;
    }
  }
  /**
   * سحب أول مقالة من مصدر واحد
   */
  async fetchFirstArticleFromSource(
    source: RSSSource
  ): Promise<RSSFetchResult> {
    try {
      // سحب وتحليل RSS باستخدام rss-parser
      const feed = await this.parser.parseURL(source.url);

      // التحقق من وجود مقالات
      if (!feed.items || feed.items.length === 0) {
        return {
          source,
          article: null,
          error: 'لا توجد مقالات في هذا المصدر',
        };
      }

      // استخراج بيانات أول مقالة
      const firstItem = feed.items[0];
      const article: RSSArticle = {
        title: firstItem.title || 'بدون عنوان',
        description: this.cleanDescription(
          firstItem.content || firstItem.summary || 'بدون وصف'
        ),
        link: this.cleanLink(firstItem.link || ''),
        pubDate: firstItem.pubDate || '',
        source: source.name,
      };

      return {
        source,
        article,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'خطأ غير معروف';

      return {
        source,
        article: null,
        error: `فشل سحب البيانات: ${errorMessage}`,
      };
    }
  }

  /**
   * سحب عدد محدد من المقالات من مصدر واحد
   */
  async fetchArticlesFromSource(
    source: RSSSource,
    limit: number = 20
  ): Promise<RSSFetchResult[]> {
    try {
      // سحب وتحليل RSS باستخدام rss-parser
      const feed = await this.parser.parseURL(source.url);

      // التحقق من وجود مقالات
      if (!feed.items || feed.items.length === 0) {
        return [
          {
            source,
            article: null,
            error: 'لا توجد مقالات في هذا المصدر',
          },
        ];
      }

      // استخراج عدد محدد من المقالات
      const items = feed.items.slice(0, limit);
      const results: RSSFetchResult[] = items.map((item) => {
        const article: RSSArticle = {
          title: item.title || 'بدون عنوان',
          description: this.cleanDescription(
            item.content || item.summary || 'بدون وصف'
          ),
          link: this.cleanLink(item.link || ''),
          pubDate: item.pubDate || '',
          source: source.name,
          image_url: this.extractImageUrl(item),
          tags: this.extractTags(item),
        };

        return {
          source,
          article,
          error: null,
        };
      });

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'خطأ غير معروف';

      return [
        {
          source,
          article: null,
          error: `فشل سحب البيانات: ${errorMessage}`,
        },
      ];
    }
  }

  /**
   * سحب أول مقالة من مصفوفة مصادر
   * 
   * @param sources - مصفوفة المصادر المراد السحب منها
   * @returns مصفوفة بنتائج السحب
   */
  async fetchFromSources(sources: RSSSource[]): Promise<RSSFetchResult[]> {
    const results = await Promise.all(
      sources.map((source) => this.fetchFirstArticleFromSource(source))
    );

    return results;
  }

  /**
   * سحب عدد محدد من المقالات من مصفوفة مصادر
   * 
   * @param sources - مصفوفة المصادر المراد السحب منها
   * @param limit - عدد المقالات من كل مصدر (افتراضي: 20)
   * @returns مصفوفة بنتائج السحب
   */
  async fetchMultipleFromSources(
    sources: RSSSource[],
    limit: number = 20
  ): Promise<RSSFetchResult[]> {
    const results = await Promise.all(
      sources.map((source) => this.fetchArticlesFromSource(source, limit))
    );

    // تسطيح المصفوفة (flatten)
    return results.flat();
  }
}

// تصدير instance واحد من الخدمة
export const rssFetcherService = new RSSFetcherService();
