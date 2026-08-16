import type { VercelRequest, VercelResponse } from './vercel-shim';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'ok',
    service: 'enterprise-ai-workspace',
    mode: 'vercel-serverless-node',
    routes: [
      'GET /api/health',
      'GET /api/docs',
      'POST /api/v1/gateway/dispatch',
      'POST /api/v1/agent/chat',
    ],
  });
}
