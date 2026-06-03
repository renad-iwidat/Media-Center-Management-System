/**
 * NewsDesk API Service
 * خدمة سحب الأخبار من NewsDesk API الخارجي
 * بديل عن RSS Fetcher — يسحب الأخبار الجاهزة من API مركزي
 * 
 * Base URL: configured via NEWSDESK_API_URL env variable
 */

const NEWSDESK_API_BASE = process.env.NEWSDESK_API_URL || 'https://newsdesk-api.liminal.ps';

/**
 * واجهة لتمثيل مقالة خام من الـ API (endpoint: /articles/raw)
 */
export interface NewsDeskRawArticle {
  id: number;
  source_id: number;
  apify_run_id?: string;
  raw_url: string;
  raw_title: string;
  raw_text: string;
  raw_summary?: string;
  raw_authors?: string;
  raw_keywords?: string;           // keywords كـ string مفصولة بفواصل → تتحول لـ tags
  raw_published_at?: string;
  raw_top_image_url?: string;
  source_url?: string;
  processing_status?: string;
  fetched_at: string;
  created_at?: string;
  raw_meta?: Record<string, any>;
}

/**
 * واجهة لتمثيل مقالة معالجة من الـ API (endpoint: /articles) — للتوافق مع الكود القديم
 */
export interface NewsDeskArticle {
  id: number;
  title: string;
  summary: string;
  text?: string;
  url: string;
  top_image_url: string | null;
  authors: string | null;
  keywords: string | null;
  language: string;
  published_at: string;
  ai_confidence: number | null;
  ai_processed: boolean;
  views_count: number;
  created_at: string;
  category: {
    slug: string;
    name_ar: string;
    name_en: string;
  } | null;
  geo_scope: {
    slug: string;
    name_ar: string;
    name_en: string;
    scope_level: string;
  } | null;
  source: {
    slug: string;
    name: string;
    base_url: string;
  } | null;
  classifications?: Array<{
    category: { slug: string; name_ar: string };
    geo_scope: { slug: string; name_ar: string };
    confidence: number;
    is_primary: boolean;
    classified_by: string;
    classified_at: string;
  }>;
  media_units?: Array<{
    slug: string;
    name: string;
    logo_url: string;
    country: string;
  }>;
}

/**
 * واجهة لنتيجة قائمة المقالات المعالجة
 */
export interface NewsDeskArticlesResponse {
  items: NewsDeskArticle[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * واجهة لنتيجة قائمة المقالات الخام
 */
export interface NewsDeskRawArticlesResponse {
  items: NewsDeskRawArticle[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * واجهة لمصدر من الـ API
 */
export interface NewsDeskSource {
  id: number;
  slug: string;
  name: string;
  base_url: string;
  source_type_slug: string;
  is_active: boolean;
  schedule_cron: string;
  country: string;
  language: string;
}

/**
 * واجهة لحالة النظام
 */
export interface NewsDeskHealth {
  status: string;
  db_status: string;
  active_sources: number;
  scheduler_status: string;
}

/**
 * واجهة لفلاتر جلب المقالات
 */
export interface ArticleFilters {
  category?: string;
  geo_scope?: string;
  source?: string;
  media_unit?: string;
  language?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * فئة NewsDesk API Service
 */
class NewsDeskApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NEWSDESK_API_BASE;
  }

  /**
   * طلب HTTP عام — مع retry ذكي وRate Limiting
   */
  private async request<T>(endpoint: string, options?: RequestInit, retries: number = 3): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        // Rate limiting — انتظر وأعد المحاولة
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '5');
          console.warn(`⚠️ Rate limited (429) — انتظار ${retryAfter}s (محاولة ${attempt}/${retries})`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`NewsDesk API Error: ${response.status} ${response.statusText} — ${errorText}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // لا نعيد المحاولة على أخطاء 4xx (client errors) ما عدا 429
        if (lastError.message.includes('4') && !lastError.message.includes('429')) {
          throw lastError;
        }

        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.warn(`⚠️ محاولة ${attempt}/${retries} فشلت — انتظار ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`فشل الاتصال بـ NewsDesk API (${url})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Health & System
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * فحص حالة الـ API
   */
  async healthCheck(): Promise<NewsDeskHealth> {
    return this.request<NewsDeskHealth>('/health');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Articles (Processed)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * جلب المقالات الخام (raw) — البيانات كما جاءت من المصدر
   */
  async getRawArticles(filters: ArticleFilters = {}): Promise<NewsDeskRawArticlesResponse> {
    const params = new URLSearchParams();
    
    if (filters.source) params.append('source', filters.source);
    if (filters.language) params.append('language', filters.language);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const endpoint = `/articles/raw${queryString ? `?${queryString}` : ''}`;
    
    return this.request<NewsDeskRawArticlesResponse>(endpoint);
  }

  /**
   * جلب المقالات المعالجة مع فلاتر
   */
  async getArticles(filters: ArticleFilters = {}): Promise<NewsDeskArticlesResponse> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.geo_scope) params.append('geo_scope', filters.geo_scope);
    if (filters.source) params.append('source', filters.source);
    if (filters.media_unit) params.append('media_unit', filters.media_unit);
    if (filters.language) params.append('language', filters.language);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const endpoint = `/articles${queryString ? `?${queryString}` : ''}`;
    
    return this.request<NewsDeskArticlesResponse>(endpoint);
  }

  /**
   * جلب مقالة واحدة بالـ ID — مع النص الكامل
   */
  async getArticleById(id: number): Promise<NewsDeskArticle> {
    return this.request<NewsDeskArticle>(`/articles/${id}`);
  }

  /**
   * جلب مقالة خام واحدة بالـ ID — مع raw_text و raw_meta
   */
  async getRawArticleById(id: number): Promise<NewsDeskRawArticle> {
    return this.request<NewsDeskRawArticle>(`/articles/raw/${id}`);
  }

  /**
   * جلب مقالات حسب المصدر
   */
  async getArticlesBySource(sourceSlug: string, filters: ArticleFilters = {}): Promise<NewsDeskArticlesResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.language) params.append('language', filters.language);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    return this.request<NewsDeskArticlesResponse>(`/articles/by-source/${sourceSlug}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * جلب مقالات حسب الوحدة الإعلامية
   * يُستخدم لسحب الأخبار التابعة لوحدة إعلامية محددة
   */
  async getArticlesByMediaUnit(mediaUnitSlug: string, filters: ArticleFilters = {}): Promise<NewsDeskArticlesResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.geo_scope) params.append('geo_scope', filters.geo_scope);
    if (filters.source) params.append('source', filters.source);
    if (filters.language) params.append('language', filters.language);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    return this.request<NewsDeskArticlesResponse>(`/articles/by-media-unit/${mediaUnitSlug}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * جلب مقالات حسب التصنيف
   */
  async getArticlesByCategory(categorySlug: string, filters: ArticleFilters = {}): Promise<NewsDeskArticlesResponse> {
    const params = new URLSearchParams();
    if (filters.source) params.append('source', filters.source);
    if (filters.language) params.append('language', filters.language);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    return this.request<NewsDeskArticlesResponse>(`/articles/by-category/${categorySlug}${queryString ? `?${queryString}` : ''}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Sources
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * جلب جميع المصادر
   */
  async getSources(activeOnly: boolean = false): Promise<NewsDeskSource[]> {
    const endpoint = activeOnly ? '/sources?active_only=true' : '/sources';
    return this.request<NewsDeskSource[]>(endpoint);
  }

  /**
   * جلب مصدر واحد
   */
  async getSourceBySlug(slug: string): Promise<NewsDeskSource> {
    return this.request<NewsDeskSource>(`/sources/${slug}`);
  }

  /**
   * إنشاء مصدر جديد
   */
  async createSource(data: any): Promise<any> {
    return this.request<any>('/sources', { method: 'POST', body: JSON.stringify(data) });
  }

  /**
   * تحديث مصدر
   */
  async updateSource(slug: string, data: any): Promise<any> {
    return this.request<any>(`/sources/${slug}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * حذف (إيقاف) مصدر
   */
  async deleteSource(slug: string): Promise<any> {
    return this.request<any>(`/sources/${slug}`, { method: 'DELETE' });
  }

  /**
   * تفعيل مصدر
   */
  async activateSource(slug: string): Promise<any> {
    return this.request<any>(`/sources/${slug}/activate`, { method: 'POST' });
  }

  /**
   * إيقاف مصدر
   */
  async deactivateSource(slug: string): Promise<any> {
    return this.request<any>(`/sources/${slug}/deactivate`, { method: 'POST' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Admin
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * إحصائيات الداشبورد
   */
  async getAdminStats(): Promise<any> {
    return this.request<any>('/admin/stats');
  }

  /**
   * جلب الإعدادات
   */
  async getAdminSettings(): Promise<any> {
    return this.request<any>('/admin/settings');
  }

  /**
   * تحديث الإعدادات
   */
  async updateAdminSettings(data: any): Promise<any> {
    return this.request<any>('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) });
  }

  /**
   * جلب سجل تغييرات الإعدادات
   */
  async getAdminSettingsLogs(): Promise<any> {
    return this.request<any>('/admin/settings-logs');
  }

  /**
   * جلب المصادر (admin)
   */
  async getAdminSources(): Promise<any> {
    return this.request<any>('/admin/sources');
  }

  /**
   * تبديل حالة مصدر (admin)
   */
  async toggleAdminSource(slug: string): Promise<any> {
    return this.request<any>(`/admin/sources/${slug}/toggle`, { method: 'POST' });
  }

  /**
   * جلب السجلات (admin)
   */
  async getAdminLogs(params?: { source_slug?: string; status?: string; days?: number; page?: number; page_size?: number }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.source_slug) searchParams.append('source_slug', params.source_slug);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.days) searchParams.append('days', params.days.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    const qs = searchParams.toString();
    return this.request<any>(`/admin/logs${qs ? `?${qs}` : ''}`);
  }

  /**
   * تشغيل التصنيف يدوياً
   */
  async runClassifier(limit?: number): Promise<any> {
    const endpoint = limit ? `/classifier/run?limit=${limit}` : '/classifier/run';
    return this.request<any>(endpoint, { method: 'POST' });
  }

  /**
   * إحصائيات التصنيف
   */
  async getClassifierStats(): Promise<any> {
    return this.request<any>('/classifier/stats');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Scraper Control
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * تشغيل السحب من الـ API (كل المصادر أو مصدر محدد)
   */
  async triggerFetch(sourceSlug?: string): Promise<any> {
    const endpoint = sourceSlug 
      ? `/scraper/fetch?source_slug=${sourceSlug}` 
      : '/scraper/fetch';
    return this.request<any>(endpoint, { method: 'POST' });
  }

  /**
   * تشغيل السحب بالخلفية (non-blocking)
   */
  async triggerFetchAsync(): Promise<any> {
    return this.request<any>('/scraper/fetch-async', { method: 'POST' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Categories & Geographic Scopes
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * جلب التصنيفات
   */
  async getCategories(activeOnly: boolean = false): Promise<any[]> {
    const endpoint = activeOnly ? '/categories?active_only=true' : '/categories';
    return this.request<any[]>(endpoint);
  }

  /**
   * جلب النطاقات الجغرافية
   */
  async getGeographicScopes(scopeLevel?: string): Promise<any[]> {
    const endpoint = scopeLevel 
      ? `/geographic-scopes?scope_level=${scopeLevel}` 
      : '/geographic-scopes';
    return this.request<any[]>(endpoint);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Media Units
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * جلب جميع الوحدات الإعلامية من الـ API الخارجي
   */
  async getMediaUnits(activeOnly: boolean = false): Promise<any[]> {
    const endpoint = activeOnly ? '/media-units?active_only=true' : '/media-units';
    return this.request<any[]>(endpoint);
  }

  /**
   * جلب وحدة إعلامية واحدة مع مصادرها
   */
  async getMediaUnitBySlug(slug: string): Promise<any> {
    return this.request<any>(`/media-units/${slug}`);
  }

  /**
   * جلب الوحدات الإعلامية من الـ admin endpoint (مع تفاصيل كاملة)
   */
  async getAdminMediaUnits(activeOnly: boolean = false): Promise<any[]> {
    const endpoint = activeOnly ? '/admin/media-units?active_only=true' : '/admin/media-units';
    return this.request<any[]>(endpoint);
  }

  /**
   * جلب وحدة إعلامية واحدة من الـ admin endpoint
   */
  async getAdminMediaUnitBySlug(slug: string): Promise<any> {
    return this.request<any>(`/admin/media-units/${slug}`);
  }

  /**
   * مزامنة الوحدات الإعلامية والمصادر من الـ API الخارجي إلى الداتابيس المحلي
   * يُستخدم لإنشاء/تحديث media_units و sources و media_unit_sources
   */
  async syncAllMediaUnitsAndSources(): Promise<{
    mediaUnits: any[];
    totalSources: number;
  }> {
    const mediaUnits = await this.getAdminMediaUnits();
    let totalSources = 0;
    for (const unit of mediaUnits) {
      totalSources += (unit.sources || []).length;
    }
    return { mediaUnits, totalSources };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Scheduler (Remote)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * حالة الـ scheduler على الـ API الخارجي
   */
  async getRemoteSchedulerStatus(): Promise<any> {
    return this.request<any>('/scheduler/status');
  }

  /**
   * بدء الـ scheduler على الـ API الخارجي
   */
  async startRemoteScheduler(): Promise<any> {
    return this.request<any>('/scheduler/start', { method: 'POST' });
  }

  /**
   * إيقاف الـ scheduler على الـ API الخارجي
   */
  async stopRemoteScheduler(): Promise<any> {
    return this.request<any>('/scheduler/stop', { method: 'POST' });
  }
}

// تصدير instance واحد
export const newsDeskApiService = new NewsDeskApiService();
