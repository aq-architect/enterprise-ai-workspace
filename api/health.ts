import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Public ping — use this to verify the deployment is reachable without auth. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'ok',
    service: 'enterprise-ai-workspace',
    mode: 'vercel-serverless',
  });
}
