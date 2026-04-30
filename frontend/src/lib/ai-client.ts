/**
 * AI Content Generator
 * يرسل الطلبات للـ backend بدل استدعاء Gemini مباشرة من الفرونت
 */

import { getAuthToken } from '../services/api';

// استخدام VITE_API_URL من environment variables
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Helper function to get headers with Authorization
function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Callback type for progress updates
export type ProgressCallback = (message: string) => void;

// Helper function to fetch without timeout (waits indefinitely)
// but with progress updates from server
async function fetchWithProgress(
  url: string,
  options: RequestInit & { onProgress?: ProgressCallback } = {}
): Promise<Response> {
  const { onProgress, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
    });
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    throw error;
  }
}

// ─── Chat / Generate ──────────────────────────────────────────
export async function generateAIContent(
  prompt: string,
  systemInstruction: string = '',
  options?: { max_tokens?: number; onProgress?: ProgressCallback }
): Promise<string> {
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  const response = await fetchWithProgress(`${API_URL}/ai-hub/chat/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: fullPrompt,
      ...(options?.max_tokens ? { max_tokens: options.max_tokens } : {}),
    }),
    onProgress: options?.onProgress,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'AI request failed');
  return data.result ?? '';
}

// ─── Summarize ────────────────────────────────────────────────
export type SummarizeStyle = 'bullet_points' | 'short_paragraph' | 'headlines';

export async function summarizeContent(
  text: string,
  style: SummarizeStyle = 'bullet_points',
  onProgress?: ProgressCallback
): Promise<string> {
  const response = await fetchWithProgress(`${API_URL}/ai-hub/chat/summarize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, style }),
    onProgress,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Summarize request failed');
  return data.result ?? '';
}

// ─── Rewrite ──────────────────────────────────────────────────
export type RewriteStyle = 'radio_broadcast' | 'investigative' | 'social_media' | 'formal' | 'casual';

export async function rewriteContent(
  text: string,
  style: RewriteStyle = 'radio_broadcast',
  onProgress?: ProgressCallback
): Promise<string> {
  const response = await fetchWithProgress(`${API_URL}/ai-hub/chat/rewrite`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, style }),
    onProgress,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Rewrite request failed');
  return data.result ?? '';
}

// ─── Ideas / Questions / Titles feature ──────────────────────
export interface IdeasPayload {
  tool: 'IDEAS' | 'QUESTIONS' | 'TITLES';
  program: {
    title: string;
    description?: string;
    media_unit_name?: string;
  };
  episode?: {
    title: string;
    air_date?: string;
    guests?: string[];
  };
  guest?: {
    name: string;
    title?: string;
  };
  additional_context?: string;
}

export async function generateIdeasContent(payload: IdeasPayload): Promise<string> {
  const response = await fetchWithProgress(`${API_URL}/ai-hub/ideas/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Ideas request failed');
  return data.result ?? '';
}
