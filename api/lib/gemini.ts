import type { VercelRequest } from '../vercel-shim';

export type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export function readJsonBody(req: VercelRequest): Record<string, unknown> {
  const body = req.body;
  if (body == null || body === '') {
    return {};
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body || '{}') as Record<string, unknown>;
    } catch {
      throw new Error('Request body is not valid JSON');
    }
  }
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8') || '{}') as Record<string, unknown>;
    } catch {
      throw new Error('Request body is not valid JSON');
    }
  }
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  return {};
}

export function readPrompt(req: VercelRequest): string {
  const payload = readJsonBody(req);
  return typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in Vercel → Project → Settings → Environment Variables (Production), then Redeploy.',
    );
  }

  const model = process.env.LLM_MODEL || 'gemini-2.5-flash';
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  const data = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}

export function modelLabel(): string {
  return process.env.LLM_MODEL || 'gemini-2.5-flash';
}
