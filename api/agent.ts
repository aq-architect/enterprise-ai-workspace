import type { VercelRequest, VercelResponse } from './vercel-shim';
import { callGemini, modelLabel, readPrompt } from './lib/gemini';

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
    const prompt = readPrompt(req);
    if (!prompt) {
      return res.status(400).json({ success: false, detail: 'Missing prompt' });
    }

    const finalOutput = await callGemini(prompt);
    return res.status(200).json({
      success: true,
      pipeline_history: [
        prompt,
        `[Serverless Agent / ${modelLabel()}]`,
        finalOutput,
      ],
      final_output: finalOutput,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, detail: message });
  }
}
