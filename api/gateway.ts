import type { VercelRequest, VercelResponse } from './vercel-shim';
import { callGemini, modelLabel, readPrompt } from './lib/gemini';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Studio UI entrypoint — calls Gemini directly (no Python / Nest proxy).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = readPrompt(req);
    if (!prompt) {
      return res.status(400).json({ error: 'Missing parameter: prompt' });
    }

    const finalOutput = await callGemini(prompt);

    return res.status(200).json({
      source: '@aq-architect/serverless-gateway',
      gatewayStatus: 'synchronized',
      mode: 'gemini-direct',
      data: {
        success: true,
        pipeline_history: [
          prompt,
          `[Serverless Gateway / ${modelLabel()}]`,
          finalOutput,
        ],
        final_output: finalOutput,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      source: '@aq-architect/serverless-gateway',
      gatewayStatus: 'error',
      mode: 'gemini-direct',
      error: message,
    });
  }
}
