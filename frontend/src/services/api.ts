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
  approveQueueItem: (id: number) =>
    request<any>(`/flow/queue/${id}/approve`, { method: "POST" }),
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
  applyPolicy: (data: { text: string; policyName: string; articleId?: number }) =>
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
};
