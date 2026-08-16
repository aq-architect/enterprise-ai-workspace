import type { VercelRequest, VercelResponse } from './vercel-shim';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    throw new Error('GEMINI_API_KEY is not configured in Vercel Environment Variables');
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

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, detail: 'Method not allowed' });
  }

  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
      return res.status(400).json({ success: false, detail: 'Missing prompt' });
    }

    const finalOutput = await callGemini(prompt);
    return res.status(200).json({
      success: true,
      pipeline_history: [
        prompt,
        `[Serverless Agent / ${process.env.LLM_MODEL || 'gemini-2.5-flash'}]`,
        finalOutput,
      ],
      final_output: finalOutput,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, detail: message });
  }
}
