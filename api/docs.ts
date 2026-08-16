import type { VercelRequest, VercelResponse } from './vercel-shim';

/**
 * Lightweight API catalog for the Vercel serverless deployment.
 * (Full FastAPI Swagger at /docs only exists when running local agent-core.)
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    title: 'Enterprise AI Workspace — Serverless API',
    mode: 'gemini-direct',
    note:
      'No FastAPI Swagger on Vercel. Set GEMINI_API_KEY in Vercel env, then POST prompts below.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        description: 'Health check',
      },
      {
        method: 'GET',
        path: '/api/docs',
        description: 'This API catalog',
      },
      {
        method: 'POST',
        path: '/api/v1/gateway/dispatch',
        description: 'Studio UI gateway → Gemini (direct)',
        body: { prompt: 'string' },
      },
      {
        method: 'POST',
        path: '/api/v1/agent/chat',
        description: 'Direct agent chat → Gemini',
        body: { prompt: 'string' },
      },
    ],
    ui: '/',
    localSwagger: 'http://localhost:8000/docs',
  });
}
