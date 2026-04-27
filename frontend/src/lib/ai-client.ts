/**
 * AI Content Generator
 * يرسل الطلبات للـ backend بدل استدعاء Gemini مباشرة من الفرونت
 */

// استخدام VITE_API_URL من environment variables
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ─── Chat / Generate ──────────────────────────────────────────
export async function generateAIContent(
  prompt: string,
  systemInstruction: string = '',
  options?: { max_tokens?: number }
): Promise<string> {
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  const response = await fetch(`${API_URL}/ai-hub/chat/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      ...(options?.max_tokens ? { max_tokens: options.max_tokens } : {}),
    }),
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
  style: SummarizeStyle = 'bullet_points'
): Promise<string> {
  const response = await fetch(`${API_URL}/ai-hub/chat/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, style }),
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
  style: RewriteStyle = 'radio_broadcast'
): Promise<string> {
  const response = await fetch(`${API_URL}/ai-hub/chat/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, style }),
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
  };
  additional_context?: string;
}

export async function generateIdeasContent(payload: IdeasPayload): Promise<string> {
  const response = await fetch(`${API_URL}/ai-hub/ideas/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
