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
      // تسجيل الحقول المخصصة حتى يتعرف عليها rss-parser
      customFields: {
        item: [
          // ── media namespace ──────────────────────────────────────────────
          ['media:content',   'media:content',   { keepArray: true }],
          ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
          ['media:group',     'media:group'],
          // ── dublin core ──────────────────────────────────────────────────
          ['dc:creator',  'dc:creator'],
          ['dc:subject',  'dc:subject'],
          ['dc:date',     'dc:date'],
          ['dc:image',    'dc:image'],
          // ── itunes (بعض الـ feeds الإخبارية تستخدمه) ────────────────────
          ['itunes:image',   'itunes:image'],
          ['itunes:summary', 'itunes:summary'],
          // ── content namespace ────────────────────────────────────────────
          ['content:encoded', 'content:encoded'],
          // ── atom / misc ──────────────────────────────────────────────────
          ['enclosure', 'enclosure'],
          ['rights',    'rights'],
        ],
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
   *
   * الحالات المدعومة (مرتبة بالأولوية):
   *
   * ① media:content url="..."  ← Aawsat / Arab48
   *    <media:content url="https://..." type="image/jpeg"/>
   *
   * ② media:content > media:thumbnail url="..."  ← BBC Arabic
   *    <media:content>
   *      <media:thumbnail url="https://..." width="106" height="60"/>
   *    </media:content>
   *
   * ③ media:thumbnail url="..."  ← BBC Arabic Live
   *    <media:thumbnail width="240" height="135" url="https://..."/>
   *
   * ④ media:group > media:content / media:thumbnail  ← YouTube وغيرها
   *
   * ⑤ enclosure url="..."  ← Podcast / RSS قديم
   *
   * ⑥ <img src="..."> داخل description / content / summary  ← Arab48 وغيرها
   *
   * ⑦ dc:image / itunes:image
   */
  private extractImageUrl(item: any): string {

    // ── ① media:content ──────────────────────────────────────────────────
    if (item['media:content']) {
      const mc = item['media:content'];
      const list = Array.isArray(mc) ? mc : [mc];

      for (const entry of list) {
        // ① أ. url مباشر على العنصر  ← Aawsat / Arab48
        if (entry.$ && entry.$.url) return entry.$.url;
        // ① ب. url كـ string مباشر (بعض الـ parsers)
        if (typeof entry.url === 'string' && entry.url) return entry.url;

        // ① ج. media:thumbnail nested داخل media:content  ← BBC Arabic
        const nested = entry['media:thumbnail'];
        if (nested) {
          const nList = Array.isArray(nested) ? nested : [nested];
          for (const t of nList) {
            if (t.$ && t.$.url) return t.$.url;
            if (typeof t.url === 'string' && t.url) return t.url;
          }
        }
      }
    }

    // ── ② media:thumbnail مستقلة  ← BBC Arabic Live ──────────────────────
    if (item['media:thumbnail']) {
      const mt = item['media:thumbnail'];
      const list = Array.isArray(mt) ? mt : [mt];
      for (const t of list) {
        if (t.$ && t.$.url) return t.$.url;
        if (typeof t.url === 'string' && t.url) return t.url;
      }
    }

    // ── ③ media:group  ← YouTube وغيرها ──────────────────────────────────
    if (item['media:group']) {
      const group = item['media:group'];
      // media:group > media:content
      if (group['media:content']) {
        const mc = Array.isArray(group['media:content']) ? group['media:content'] : [group['media:content']];
        for (const e of mc) {
          if (e.$ && e.$.url) return e.$.url;
        }
      }
      // media:group > media:thumbnail
      if (group['media:thumbnail']) {
        const mt = Array.isArray(group['media:thumbnail']) ? group['media:thumbnail'] : [group['media:thumbnail']];
        for (const t of mt) {
          if (t.$ && t.$.url) return t.$.url;
        }
      }
    }

    // ── ④ enclosure  ← RSS قديم / Podcast ───────────────────────────────
    if (item.enclosure) {
      const enc = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
      if (enc && enc.url && (!enc.type || enc.type.startsWith('image/'))) {
        return enc.url;
      }
    }

    // ── ⑤ rss-parser camelCase aliases ───────────────────────────────────
    if (item.mediaContent) {
      const mc = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
      for (const e of mc) {
        if (e.url) return e.url;
        if (e.$ && e.$.url) return e.$.url;
      }
    }
    if (item.media) {
      const m = Array.isArray(item.media) ? item.media : [item.media];
      for (const e of m) {
        if (e.url) return e.url;
      }
    }

    // ── ⑥ dc:image / itunes:image ────────────────────────────────────────
    if (item['dc:image']) return item['dc:image'];
    if (item['itunes:image']) {
      const img = item['itunes:image'];
      if (typeof img === 'string') return img;
      if (img.$ && img.$.href) return img.$.href;
    }

    // ── ⑦ <img src="..."> داخل النصوص  ← Arab48 / وغيرها ────────────────
    // نبحث بالترتيب: content:encoded → content → description → summary
    const htmlFields = [
      item['content:encoded'],
      item.content,
      item.description,
      item.summary,
    ];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    for (const field of htmlFields) {
      if (typeof field === 'string' && field) {
        const m = field.match(imgRegex);
        if (m && m[1] && m[1].startsWith('http')) return m[1];
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
   * تنظيف الرابط من HTML encoding والروابط المشوهة
   * يستخرج الرابط الحقيقي من الروابط المشفرة مثل:
   * https://aawsat.com/%3Ca%20href%3D%22https%3A//aawsat.com/...
   */
  private cleanLink(link: string): string {
    if (!link) return '';
    
    try {
      // ── المرحلة 1: فك الترميز الأول ────────────────────────────────────
      let decoded = decodeURIComponent(link);
      
      // ── المرحلة 2: استخراج href من HTML tags ─────────────────────────
      // البحث عن href="..." أو href='...'
      const hrefMatch = decoded.match(/href=["']([^"']+)["']/i);
      if (hrefMatch && hrefMatch[1]) {
        decoded = hrefMatch[1];
      }
      
      // ── المرحلة 3: فك الترميز الثاني ────────────────────────────────────
      // لو الرابط لسا فيه %XX encoding
      if (decoded.includes('%')) {
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          // إذا فشل الـ decode، نستخدم الرابط كما هو
        }
      }
      
      // ── المرحلة 4: إزالة HTML tags المتبقية ──────────────────────────
      decoded = decoded.replace(/<[^>]*>/g, '').trim();
      
      // ── المرحلة 5: التحقق من صحة الرابط ──────────────────────────────
      if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
        return '';
      }
      
      return decoded;
    } catch (error) {
      console.warn(`⚠️  فشل تنظيف الرابط: ${link.substring(0, 100)}`);
      return '';
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
      const link = this.cleanLink(firstItem.link || '');
      
      // تخطي الروابط الفارغة
      if (!link) {
        return {
          source,
          article: null,
          error: 'رابط المقالة فارغ',
        };
      }

      const article: RSSArticle = {
        title: firstItem.title || 'بدون عنوان',
        description: this.cleanDescription(
          firstItem.content || firstItem.summary || 'بدون وصف'
        ),
        link,
        pubDate: firstItem.pubDate || '',
        source: source.name,
        image_url: this.extractImageUrl(firstItem),
        tags: this.extractTags(firstItem),
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
   * مع تصفية الروابط الموجودة بالفعل
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
      const results: RSSFetchResult[] = [];

      for (const item of items) {
        const link = this.cleanLink(item.link || '');
        
        // تخطي الروابط الفارغة
        if (!link) {
          console.log(`⏭️  تخطي مقالة بدون رابط`);
          continue;
        }

        const article: RSSArticle = {
          title: item.title || 'بدون عنوان',
          description: this.cleanDescription(
            item.content || item.summary || 'بدون وصف'
          ),
          link,
          pubDate: item.pubDate || '',
          source: source.name,
          image_url: this.extractImageUrl(item),
          tags: this.extractTags(item),
        };

        results.push({
          source,
          article,
          error: null,
        });
      }

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
