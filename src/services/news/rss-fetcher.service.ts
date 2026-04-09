/**
 * RSS Fetcher Service
 * 
 * مسؤول عن سحب الأخبار من مصادر RSS المختلفة
 * وتحويلها إلى صيغة موحدة
 */

import Parser from 'rss-parser';
import { RSS_SOURCES, RSS_SOURCES_DIVERSE, RSSSource } from '../../config/rss-sources';
import { RawDataService, SourceService } from '../database/database.service';

/**
 * واجهة لتمثيل مقالة RSS
 */
export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
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
   * تنظيف الرابط من HTML encoding
   */
  private cleanLink(link: string): string {
    try {
      return decodeURIComponent(link).replace(/<[^>]*>/g, '').trim();
    } catch {
      return link;
    }
  }
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
   * سحب أول مقالة من جميع المصادر
   * 
   * @returns مصفوفة بنتائج السحب من جميع المصادر
   */
  async fetchFirstArticleFromAllSources(): Promise<RSSFetchResult[]> {
    const results = await Promise.all(
      RSS_SOURCES.map((source) => this.fetchFirstArticleFromSource(source))
    );

    return results;
  }

  /**
   * سحب أول مقالة من جميع المصادر المتنوعة
   * 
   * @returns مصفوفة بنتائج السحب من جميع المصادر المتنوعة
   */
  async fetchFirstArticleFromDiverseSources(): Promise<RSSFetchResult[]> {
    const results = await Promise.all(
      RSS_SOURCES_DIVERSE.map((source) =>
        this.fetchFirstArticleFromSource(source)
      )
    );

    return results;
  }
}

// تصدير instance واحد من الخدمة
export const rssFetcherService = new RSSFetcherService();
