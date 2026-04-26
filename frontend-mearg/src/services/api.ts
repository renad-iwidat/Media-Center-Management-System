/**
 * API Service - ربط الفرونت اند بالباكند
 */

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let errMsg = `API Error: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) errMsg = body.error;
      else if (body?.message) errMsg = body.message;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

// --- Data / Statistics ---
export const api = {
  // إحصائيات
  getStatistics: () => request<any>("/data/statistics"),
  
  // مصادر
  getSources: () => request<any>("/data/sources"),
  getActiveSources: () => request<any>("/data/sources/active"),
  getSourcesWithFetchInfo: () => request<any>("/sources/fetch-info/all"),

  // وحدات الإعلام
  getMediaUnits: () => request<any>("/data/media-units"),

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
  applyPoliciesSequential: (data: { text: string; policyNames: string[] }) =>
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

  // --- Audio Extraction ---
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
  getVideoInfo: (videoFilePath: string) =>
    request<any>("/ai-hub/audio-extraction/video-info", {
      method: "POST",
      body: JSON.stringify({ videoFilePath }),
    }),
  getAudioExtractionFormats: () => request<any>("/ai-hub/audio-extraction/formats"),
};
