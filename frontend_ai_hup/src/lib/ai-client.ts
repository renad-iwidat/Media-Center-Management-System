/**
 * AI Content Generator
 * يرسل الطلبات للـ backend بدل استدعاء Gemini مباشرة من الفرونت
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ─── Chat feature ─────────────────────────────────────────────
export async function generateAIContent(
  prompt: string,
  systemInstruction: string = ''
): Promise<string> {
  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n${prompt}`
    : prompt;

  const response = await fetch(`${API_URL}/ai-hub/chat/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: fullPrompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'AI request failed');
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
