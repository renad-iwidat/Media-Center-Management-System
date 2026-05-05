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
  : "https://media-center-management-system.onrender.com/api";

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
  processVideoToText: (videoUrl: string) =>
    request<any>("/ai-hub/video-to-text/process", {
      method: "POST",
      body: JSON.stringify({ videoUrl }),
    }),
  processVideoToTextFromS3: (s3Url: string, fileId: number) =>
    request<any>("/ai-hub/video-to-text/process-s3", {
      method: "POST",
      body: JSON.stringify({ s3Url, fileId }),
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
        forceDownloadFirst: options.forceDownloadFirst || false
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
        maxFileSize: options.maxFileSize || 1024 * 1024 * 1024 // 1GB
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
        maxConcurrentChunks: options.maxConcurrentChunks || 3
      }),
    }),
  getLegacyVideoInfo: (videoFilePath: string) =>
    request<any>("/ai-hub/audio-extraction/video-info", {
      method: "POST",
      body: JSON.stringify({ videoFilePath }),
    }),
  getAudioExtractionFormats: () => request<any>("/ai-hub/audio-extraction/formats"),

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
};
