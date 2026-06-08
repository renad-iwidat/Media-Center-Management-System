/**
 * API Service - ربط الفرونت اند بالباكند
 */

// دعم runtime environment variables من Docker
const getEnvVar = (key: keyof ImportMetaEnv): string | undefined => {
  // أولاً: جرب window.ENV (runtime من Docker)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // ثانياً: استخدم import.meta.env (build time)
  return import.meta.env[key];
};

// استخدام VITE_MANAGEMENT_API_URL لسيرفر الإدارة و VITE_API_URL لسيرفر الأخبار
const MANAGEMENT_API_BASE = getEnvVar('VITE_MANAGEMENT_API_URL')
  ? `${getEnvVar('VITE_MANAGEMENT_API_URL')}/api`
  : "https://mcms-iqsv.onrender.com/api";

const API_BASE = getEnvVar('VITE_API_URL')
  ? `${getEnvVar('VITE_API_URL')}/api`
  : "https://automation-and-ai-hub-backend.onrender.com/api";

console.log('🔗 Management API Base URL:', MANAGEMENT_API_BASE);
console.log('🔗 News API Base URL:', API_BASE);

// الحصول على التوكن من localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// حفظ التوكن في localStorage
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

// حذف التوكن من localStorage
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
}

// الحصول على بيانات المستخدم من localStorage
export function getCurrentUser(): any {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// حفظ بيانات المستخدم في localStorage
export function setCurrentUser(user: any): void {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// حذف بيانات المستخدم من localStorage
export function clearCurrentUser(): void {
  localStorage.removeItem('currentUser');
}

async function request<T>(url: string, options?: RequestInit, useManagementAPI: boolean = false): Promise<T> {
  const baseUrl = useManagementAPI ? MANAGEMENT_API_BASE : API_BASE;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  
  // إضافة التوكن إلى الهيدر إذا كان موجوداً
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`🌐 [API] ${options?.method || 'GET'} ${baseUrl}${url}`);

  // بدون timeout ثابت — الخادم يتحكم بالـ timeout
  try {
    const res = await fetch(`${baseUrl}${url}`, {
      headers,
      ...options,
    });

    console.log(`📨 [API] الرد: ${res.status} ${res.statusText}`);

    // إذا كان الرد 401 (Unauthorized) → التوكن انتهى
    if (res.status === 401) {
      console.log('⏱️ [API] التوكن انتهى (401) — إعادة توجيه إلى صفحة Login');
      
      // وضع flag إنه تم عمل logout تلقائي
      localStorage.setItem('justLoggedOut', 'true');
      
      clearAuthToken();
      clearCurrentUser();
      
      // إعادة تحميل الصفحة فوراً عشان نرجع لصفحة اللوجين
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      throw new Error('انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى');
    }

    if (!res.ok) {
      let errMsg = `API Error: ${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error) errMsg = body.error;
        else if (body?.message) errMsg = body.message;
      } catch {}
      console.error(`❌ [API] خطأ: ${errMsg}`);
      throw new Error(errMsg);
    }
    
    const data = await res.json();
    console.log(`✅ [API] الرد بنجاح`);
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('⏱️ [API] انتهت مهلة الانتظار');
      throw new Error('انتهت مهلة الانتظار — تحقق من الاتصال بالإنترنت');
    }
    console.error(`❌ [API] خطأ:`, error.message);
    throw error;
  }
}

// --- Data / Statistics ---
export const api = {
  // إحصائيات
  getStatistics: () => request<any>("/data/statistics"),
  
  // مصادر
  getSources: () => request<any>("/sources"),
  getActiveSources: () => request<any>("/data/sources/active"),

  // وحدات الإعلام
  getMediaUnits: () => request<any>("/data/media-units"), // استخدام سيرفر الأخبار (News API)
  getMediaUnitsWithSources: () => request<any>("/data/media-units/with-sources"),
  getMediaUnitSources: (slug: string) => request<any>(`/data/media-units/${slug}/sources`),

  // أخبار
  getArticles: (limit = 100, offset = 0) =>
    request<any>(`/data/articles?limit=${limit}&offset=${offset}`),
  getArticlesBySource: (sourceId: number) =>
    request<any>(`/data/articles/source/${sourceId}`),
  getArticlesByCategory: (categoryId: number) =>
    request<any>(`/data/articles/category/${categoryId}`),
  getArticleById: (id: number) =>
    request<any>(`/data/articles/${id}/detail`),
  updateArticleContent: (id: number, data: { content: string; title?: string; imageUrl?: string }) =>
    request<any>(`/data/articles/${id}/content`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateArticleCategory: (id: number, category_id: number) =>
    request<any>(`/data/articles/${id}/category`, {
      method: "PATCH",
      body: JSON.stringify({ category_id }),
    }),

  saveArticleInIncomplete: (id: number, data: { content: string; title?: string; imageUrl?: string }) =>
    request<any>(`/data/articles/${id}/content`, {
      method: "PUT",
      body: JSON.stringify({ ...data, sendToQueue: false }),
    }),

  deleteArticle: (id: number) =>
    request<any>(`/data/articles/${id}`, {
      method: "DELETE",
    }),

  // حذف جماعي
  deleteIncompleteArticles: () =>
    request<any>("/data/articles/incomplete", {
      method: "DELETE",
    }),
  deleteAllArticles: () =>
    request<any>("/data/articles", {
      method: "DELETE",
    }),

  // أخبار ناقصة
  getIncompleteArticles: (mediaUnitId?: number | null) => 
    request<any>(`/data/articles/incomplete${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),

  // تصنيفات
  getCategories: () => request<any>("/data/categories"),

  // بيانات شاملة
  getComprehensive: () => request<any>("/data/comprehensive"),

  // --- Flow / Queue ---
  processNewArticles: () =>
    request<any>("/flow/process", { method: "POST" }),
  getPendingQueue: (mediaUnitId?: number | null) =>
    request<any>(`/flow/queue/pending${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
  getEditorialStudio: (mediaUnitId?: number | null, status?: string) =>
    request<any>(`/flow/editorial${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}${status ? `${mediaUnitId ? '&' : '?'}status=${status}` : ""}`),
  getQueueStats: () => request<any>("/flow/queue/stats"),
  getQueueItem: (id: number) => request<any>(`/flow/queue/${id}`),
  approveQueueItem: (id: number, data?: any) =>
    request<any>(`/flow/queue/${id}/approve`, { 
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  rejectQueueItem: (id: number) =>
    request<any>(`/flow/queue/${id}/reject`, { method: "POST" }),

  // منشورات
  getPublished: (mediaUnitId?: number | null) =>
    request<any>(`/flow/published${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
  getPublishedStats: () => request<any>("/flow/published/stats"),
  getDailyStats: (mediaUnitId?: number | null, days: number = 30) =>
    request<any>(`/flow/daily-stats${mediaUnitId ? `?media_unit_id=${mediaUnitId}&days=${days}` : `?days=${days}`}`),
  getPublishedItem: (id: number) => request<any>(`/flow/published/${id}`),
  getPublishedByCategory: (category: string) =>
    request<any>(`/flow/published/category/${category}`),

  // --- السياسات التحريرية ---
  getPolicies: () => request<any>("/news/editorial-policies"),
  getPolicyDetails: (name: string) =>
    request<any>(`/news/editorial-policies/${encodeURIComponent(name)}`),
  createPolicy: (data: any) =>
    request<any>("/news/editorial-policies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePolicy: (name: string, data: any) =>
    request<any>(`/news/editorial-policies/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePolicy: (name: string) =>
    request<any>(`/news/editorial-policies/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
  applyPolicy: (data: { text: string; policyName?: string; policyId?: number; articleId?: number }) =>
    request<any>("/news/editorial-policies/apply", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  applyPoliciesPipeline: (data: { text: string; policyNames: string[] }) =>
    request<any>("/news/editorial-policies/pipeline", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  applyPoliciesSequential: (data: { text?: string; queueId?: number; policyIds: number[] }) =>
    request<any>("/news/editorial-policies/sequential", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  saveEditedText: (data: any) =>
    request<any>("/news/editorial-policies/save-edited", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // --- Classifier ---
  getUnclassified: () => request<any>("/news/classifier/unclassified"),
  classifyArticles: () =>
    request<any>("/news/classifier/process", { method: "POST" }),

  // --- System Settings ---
  getSystemToggles: () => request<any>("/settings/toggles"),
  setAutomationEnabled: (enabled: boolean) =>
    request<any>("/settings/toggles/bulk", {
      method: "PATCH",
      body: JSON.stringify({
        scheduler_enabled: enabled,
        classifier_enabled: enabled,
        flow_enabled: enabled,
      }),
    }),
  updateSetting: (key: string, value: string) =>
    request<any>(`/settings/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    }),

  // --- Uploaded Files ---
  getUploadedFiles: () => request<any>("/uploaded-files"),
  getAudioFiles: () => request<any>("/uploaded-files/audio"),
  getVideoFiles: () => request<any>("/uploaded-files/video"),
  getUploadedFileById: (id: number) => request<any>(`/uploaded-files/${id}`),
  getFilesBySourceType: (sourceTypeId: number) =>
    request<any>(`/uploaded-files/source-type/${sourceTypeId}`),

  // --- Programs & Episodes ---
  getPrograms: () => request<any>("/programs"),
  getProgram: (id: number) => request<any>(`/programs/${id}`),
  getProgramEpisodes: (id: number) => request<any>(`/programs/${id}/episodes`),
  getEpisodeDetails: (id: number) => request<any>(`/programs/episodes/${id}/details`),
  getEpisodeGuests: (id: number) => request<any>(`/programs/episodes/${id}/guests`),

  // --- Guests ---
  getGuests: (search?: string) => request<any>(`/guests${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getGuest: (id: number) => request<any>(`/guests/${id}`),

  // --- Video-to-Text ---
  processVideoToText: (videoUrl: string, includeTimestamps: boolean = true) =>
    request<any>("/ai-hub/video-to-text/process", {
      method: "POST",
      body: JSON.stringify({ videoUrl, includeTimestamps }),
    }),
  processVideoToTextFromS3: (s3Url: string, fileId: number, includeTimestamps: boolean = true) =>
    request<any>("/ai-hub/video-to-text/process-s3", {
      method: "POST",
      body: JSON.stringify({ s3Url, fileId, includeTimestamps }),
    }),

  // --- Text-to-Speech ---
  generateTTS: (text: string, voice: string = 'nova') =>
    request<any>("/ai-hub/tts/generate", {
      method: "POST",
      body: JSON.stringify({ text, voice }),
    }),
  getTTSVoices: () => request<any>("/ai-hub/tts/voices"),

  // --- Speech-to-Text ---
  transcribeAudioFromUrl: (audioUrl: string, language: string = 'ar') =>
    request<any>("/ai-hub/stt/transcribe-url", {
      method: "POST",
      body: JSON.stringify({ audioUrl, language }),
    }),
  transcribeAudioFromFile: (fileId: number, s3Url: string, language: string = 'ar') =>
    request<any>("/ai-hub/stt/transcribe-file", {
      method: "POST",
      body: JSON.stringify({ fileId, s3Url, language }),
    }),
  transcribeAudioFromBase64: (audioBase64: string, language: string = 'ar') =>
    request<any>("/ai-hub/stt/transcribe-base64", {
      method: "POST",
      body: JSON.stringify({ audioBase64, language }),
    }),
  transcribeAudioWithTimestamps: (audioUrl: string, language: string = 'ar', format: 'json' | 'srt' = 'json') =>
    request<any>("/ai-hub/stt/transcribe-with-timestamps", {
      method: "POST",
      body: JSON.stringify({ audioUrl, language, format }),
    }),
  getSTTLanguages: () => request<any>("/ai-hub/stt/languages"),

  // --- Production Streaming Audio Extraction ---
  
  // Start async extraction job
  startExtractionJob: (videoUrl: string, options: {
    outputFormat?: string;
    bitrate?: string;
    timeout?: number;
    maxSize?: number;
  } = {}) =>
    request<any>("/ai-hub/streaming-extraction/start", {
      method: "POST",
      body: JSON.stringify({ 
        videoUrl,
        outputFormat: options.outputFormat || 'mp3',
        bitrate: options.bitrate || '128k',
        timeout: options.timeout || 300000,
        maxSize: options.maxSize || 100 * 1024 * 1024
      }),
    }),

  // Get job status
  getExtractionJobStatus: (jobId: string) =>
    request<any>(`/ai-hub/streaming-extraction/status/${jobId}`),

  // Stream audio directly
  streamAudio: (videoUrl: string, options: {
    outputFormat?: string;
    bitrate?: string;
    timeout?: number;
  } = {}) => {
    // Return a URL for direct streaming
    const params = new URLSearchParams({
      videoUrl,
      outputFormat: options.outputFormat || 'mp3',
      bitrate: options.bitrate || '128k',
      timeout: (options.timeout || 300000).toString()
    });
    
    return `${API_BASE}/ai-hub/streaming-extraction/stream?${params}`;
  },

  // Production extract and transcribe
  extractAndTranscribeProduction: (videoUrl: string, options: {
    language?: string;
    outputFormat?: string;
    bitrate?: string;
    enableChunking?: boolean;
    chunkDurationSeconds?: number;
    maxConcurrentChunks?: number;
    forceDownloadFirst?: boolean;
    includeTimestamps?: boolean;
  } = {}) =>
    request<any>("/ai-hub/streaming-extraction/extract-and-transcribe", {
      method: "POST",
      body: JSON.stringify({
        videoUrl,
        language: options.language || 'ar',
        outputFormat: options.outputFormat || 'mp3',
        bitrate: options.bitrate || '128k',
        enableChunking: options.enableChunking ?? true,
        chunkDurationSeconds: options.chunkDurationSeconds || 180,
        maxConcurrentChunks: options.maxConcurrentChunks || 3,
        forceDownloadFirst: options.forceDownloadFirst || false,
        includeTimestamps: options.includeTimestamps ?? true
      }),
    }),

  // Download-first extraction method
  extractWithDownloadFirst: (videoUrl: string, options: {
    language?: string;
    outputFormat?: string;
    bitrate?: string;
    enableChunking?: boolean;
    chunkDurationSeconds?: number;
    maxConcurrentChunks?: number;
    maxFileSize?: number;
    includeTimestamps?: boolean;
  } = {}) =>
    request<any>("/ai-hub/streaming-extraction/download-first", {
      method: "POST",
      body: JSON.stringify({
        videoUrl,
        language: options.language || 'ar',
        outputFormat: options.outputFormat || 'mp3',
        bitrate: options.bitrate || '128k',
        enableChunking: options.enableChunking ?? true,
        chunkDurationSeconds: options.chunkDurationSeconds || 180,
        maxConcurrentChunks: options.maxConcurrentChunks || 3,
        maxFileSize: options.maxFileSize || 1024 * 1024 * 1024, // 1GB
        includeTimestamps: options.includeTimestamps ?? true
      }),
    }),

  // Get video information
  getVideoInfo: (videoUrl: string) =>
    request<any>("/ai-hub/streaming-extraction/video-info", {
      method: "POST",
      body: JSON.stringify({ videoUrl }),
    }),

  // Get system stats
  getStreamingExtractionStats: () =>
    request<any>("/ai-hub/streaming-extraction/stats"),

  // Diagnose S3 URL
  diagnoseS3Url: (videoUrl: string) =>
    request<any>("/ai-hub/streaming-extraction/diagnose", {
      method: "POST",
      body: JSON.stringify({ videoUrl }),
    }),

  // --- Legacy Audio Extraction (kept for compatibility) ---
  extractAudioFromFile: (videoFilePath: string, outputFormat: string = 'mp3', bitrate: string = '128k') =>
    request<any>("/ai-hub/audio-extraction/extract-from-file", {
      method: "POST",
      body: JSON.stringify({ videoFilePath, outputFormat, bitrate }),
    }),
  extractAudioFromUrl: (videoUrl: string, outputFormat: string = 'mp3', bitrate: string = '128k') =>
    request<any>("/ai-hub/audio-extraction/extract-from-url", {
      method: "POST",
      body: JSON.stringify({ videoUrl, outputFormat, bitrate }),
    }),
  extractAudioFromS3: (fileId: number, s3Url: string, outputFormat: string = 'mp3', bitrate: string = '128k') =>
    request<any>("/ai-hub/audio-extraction/extract-from-s3", {
      method: "POST",
      body: JSON.stringify({ fileId, s3Url, outputFormat, bitrate }),
    }),
  extractAudioAndTranscribe: (
    fileId: number, 
    s3Url: string, 
    options: {
      outputFormat?: string;
      bitrate?: string;
      language?: string;
      enableChunking?: boolean;
      chunkDurationSeconds?: number;
      maxConcurrentChunks?: number;
      includeTimestamps?: boolean;
    } = {}
  ) =>
    request<any>("/ai-hub/audio-extraction/extract-and-transcribe", {
      method: "POST",
      body: JSON.stringify({ 
        fileId, 
        s3Url, 
        outputFormat: options.outputFormat || 'mp3',
        bitrate: options.bitrate || '128k',
        language: options.language || 'ar',
        enableChunking: options.enableChunking ?? true,
        chunkDurationSeconds: options.chunkDurationSeconds || 180,
        maxConcurrentChunks: options.maxConcurrentChunks || 3,
        includeTimestamps: options.includeTimestamps ?? true
      }),
    }),
  getLegacyVideoInfo: (videoFilePath: string) =>
    request<any>("/ai-hub/audio-extraction/video-info", {
      method: "POST",
      body: JSON.stringify({ videoFilePath }),
    }),
  getAudioExtractionFormats: () => request<any>("/ai-hub/audio-extraction/formats"),

  // --- Smart Transcription ---
  smartTranscriptionProcess: (data: {
    fileUrl: string;
    fileType?: 'audio' | 'video';
    language?: string;
    outputs: Array<{
      type: 'executive_summary' | 'news_article' | 'detailed_report' | 'social_media' | 'video_clips' | 'policy_alerts';
      enabled: boolean;
      count?: number;
    }>;
    editorialPolicy?: string;
    customInfo?: string;
  }) =>
    request<any>("/ai-hub/smart-transcription/process", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  smartTranscriptionGenerateOutputs: (data: {
    transcript: string;
    outputs: Array<{
      type: 'executive_summary' | 'news_article' | 'detailed_report' | 'social_media' | 'video_clips' | 'policy_alerts';
      enabled: boolean;
      count?: number;
    }>;
    editorialPolicy?: string;
    customInfo?: string;
  }) =>
    request<any>("/ai-hub/smart-transcription/generate-outputs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  smartTranscriptionExport: (data: {
    outputs: Array<{
      type: string;
      content: string;
    }>;
    editorialPolicy?: string;
    customInfo?: string;
  }) =>
    request<any>("/ai-hub/smart-transcription/export", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // --- Smart Transcription - Outlet Based ---
  smartTranscriptionGenerateByOutlet: (data: {
    transcript: string;
    transcriptWithTimestamps?: string;
    outletSlug: string;
    customInfo?: string;
    clipCount?: number;
    socialCount?: number;
  }) =>
    request<any>("/ai-hub/smart-transcription/generate-by-outlet", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOutletProfiles: () =>
    request<any>("/ai-hub/transcription-editorial/outlets"),

  getOutputTypes: () =>
    request<any>("/ai-hub/transcription-editorial/output-types"),

  getSocialPlatforms: () =>
    request<any>("/ai-hub/transcription-editorial/social-platforms"),

  // --- Authentication (Management System) ---
  login: (email: string, password: string) =>
    request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, true),
  
  getMe: () =>
    request<any>("/auth/me", {}, true),
  
  logout: () => {
    console.log('🚪 [API] تسجيل الخروج');
    
    // وضع flag إنه تم عمل logout
    localStorage.setItem('justLoggedOut', 'true');
    
    // مسح التوكن وبيانات المستخدم
    clearAuthToken();
    clearCurrentUser();
    
    // مسح cache وحدات الإعلام
    try {
      const { clearMediaUnitsCache } = require('../lib/useMediaUnits');
      clearMediaUnitsCache();
    } catch (e) {
      // ignore if not available
    }
    
    console.log('✅ [API] تم تسجيل الخروج من API');
  },

  // --- NewsDesk API (الـ API الخارجي — عبر الـ proxy) ---
  // المصادر من الـ API الخارجي
  getNewsDeskSources: (activeOnly = false) =>
    request<any>(`/newsdesk/sources${activeOnly ? '?active_only=true' : ''}`),
  getNewsDeskSource: (slug: string) =>
    request<any>(`/newsdesk/sources/${slug}`),

  // الوحدات الإعلامية من الـ API الخارجي
  getNewsDeskMediaUnits: (activeOnly = false) =>
    request<any>(`/newsdesk/media-units${activeOnly ? '?active_only=true' : ''}`),
  getNewsDeskMediaUnit: (slug: string) =>
    request<any>(`/newsdesk/media-units/${slug}`),

  // مزامنة من الـ API الخارجي إلى الداتابيس المحلي
  syncAllFromNewsDesk: () =>
    request<any>('/newsdesk/sync/all', { method: 'POST' }),
  syncSourcesFromNewsDesk: () =>
    request<any>('/newsdesk/sync/sources', { method: 'POST' }),
  
  // حالة المزامنة والسجلات
  getSyncStatus: () =>
    request<any>('/newsdesk/sync/status'),
  getSyncLogs: (limit: number = 50, mediaUnitId?: number) =>
    request<any>(`/newsdesk/sync/logs?limit=${limit}${mediaUnitId ? `&media_unit_id=${mediaUnitId}` : ''}`),

  // التصنيفات من الـ API الخارجي
  getNewsDeskCategories: (activeOnly = false) =>
    request<any>(`/newsdesk/categories${activeOnly ? '?active_only=true' : ''}`),

  // الأخبار من الـ API الخارجي
  getNewsDeskArticles: (filters?: { category?: string; source?: string; media_unit?: string; language?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.media_unit) params.append('media_unit', filters.media_unit);
    if (filters?.language) params.append('language', filters.language);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));
    const qs = params.toString();
    return request<any>(`/newsdesk/articles${qs ? `?${qs}` : ''}`);
  },

  // إحصائيات الـ admin من الـ API الخارجي
  getNewsDeskAdminStats: () =>
    request<any>('/newsdesk/admin/stats'),

  // حالة الـ scheduler الخارجي
  getNewsDeskSchedulerStatus: () =>
    request<any>('/newsdesk/scheduler/status'),

  // --- Auto-Publish (النشر التلقائي على المواقع الخارجية) ---
  getAutoPublishStatus: () => request<any>("/auto-publish/status"),
  toggleAutoPublishMaster: (enabled: boolean) =>
    request<any>("/auto-publish/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  getAutoPublishTargets: (mediaUnitId?: number) =>
    request<any>(`/auto-publish/targets${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
  getAutoPublishTarget: (id: number) => request<any>(`/auto-publish/targets/${id}`),
  createAutoPublishTarget: (data: { media_unit_id: number; name: string; api_url: string; api_token: string; default_category_id?: number; is_enabled?: boolean }) =>
    request<any>("/auto-publish/targets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAutoPublishTarget: (id: number, data: any) =>
    request<any>(`/auto-publish/targets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAutoPublishTarget: (id: number) =>
    request<any>(`/auto-publish/targets/${id}`, { method: "DELETE" }),
  toggleAutoPublishTarget: (id: number, enabled: boolean) =>
    request<any>(`/auto-publish/targets/${id}/toggle`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  publishOneToExternal: (raw_data_id: number, target_id: number) =>
    request<any>("/auto-publish/publish-one", {
      method: "POST",
      body: JSON.stringify({ raw_data_id, target_id }),
    }),
  runAutoPublish: () =>
    request<any>("/auto-publish/run", { method: "POST" }),
  retryAutoPublish: () =>
    request<any>("/auto-publish/retry", { method: "POST" }),
  getAutoPublishLog: (targetId?: number, limit: number = 50) =>
    request<any>(`/auto-publish/log${targetId ? `?target_id=${targetId}&limit=${limit}` : `?limit=${limit}`}`),
  getExternalLinks: (rawDataId: number) =>
    request<any>(`/auto-publish/external-links/${rawDataId}`),
  getExternalLinksBatch: (rawDataIds: number[]) =>
    request<any>("/auto-publish/external-links/batch", {
      method: "POST",
      body: JSON.stringify({ raw_data_ids: rawDataIds }),
    }),

  // --- Archive (الأرشيف — المقالات المنشورة بنجاح) ---
  getArchive: (options?: { platform?: string; limit?: number; offset?: number }) =>
    request<any>(`/publishing/archive${options ? `?${new URLSearchParams(
      Object.entries(options).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString()}` : ""}`),
  archiveArticle: (articleId: number) =>
    request<any>(`/publishing/archive/${articleId}`, { method: "POST" }),
  getPublishingStatus: (articleId: number) =>
    request<any>(`/publishing/status/${articleId}`),
  getPublishingLogs: (articleId: number) =>
    request<any>(`/publishing/logs/${articleId}`),
  getPublishingStats: () =>
    request<any>("/publishing/stats"),
  getPlatformConfigs: () =>
    request<any>("/publishing/configs"),
  publishToPlatform: (articleId: number, platformConfigId: number, customContent?: string) =>
    request<any>("/publishing/publish", {
      method: "POST",
      body: JSON.stringify({ article_id: articleId, platform_config_id: platformConfigId, custom_content: customContent }),
    }),
  getPublishCooldown: (platformConfigId: number) =>
    request<any>(`/publishing/cooldown/${platformConfigId}`),

  // --- Bulletins (الموجزات والنشرات المحفوظة) ---
  getBulletins: (mediaUnitId?: number | null) =>
    request<any>(`/bulletins${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
  getBulletinById: (id: number) => request<any>(`/bulletins/${id}`),
  createBulletin: (data: {
    media_unit_id: number;
    type: 'summary' | 'bulletin';
    time_of_day: 'morning' | 'evening';
    title: string;
    original_content: string;
    edited_content?: string;
    news_count?: number;
  }) =>
    request<any>("/bulletins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBulletin: (id: number, data: { edited_content?: string; title?: string; status?: string }) =>
    request<any>(`/bulletins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteBulletin: (id: number) =>
    request<any>(`/bulletins/${id}`, { method: "DELETE" }),
  markBulletinAudioGenerated: (id: number) =>
    request<any>(`/bulletins/${id}/audio`, { method: "PATCH" }),
};
