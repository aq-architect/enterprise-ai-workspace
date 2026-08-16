import type { VercelRequest, VercelResponse } from '@vercel/node';

function resolveAgentUrl(req: VercelRequest): string {
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader?.split(',')[0]?.trim() || 'https';

  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  if (host) {
    return `${proto}://${host}/api/v1/agent/chat`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/v1/agent/chat`;
  }

  return 'http://localhost:3000/api/v1/agent/chat';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
      return res.status(400).json({ error: 'Missing parameter: prompt' });
    }

    const aiCoreUrl = resolveAgentUrl(req);
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    const response = await fetch(aiCoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return res.status(401).json({
        source: '@aq-architect/serverless-gateway',
        gatewayStatus: 'error',
        error:
          'Vercel returned 401 (Deployment Protection). Disable Protection in Vercel → Project → Settings → Deployment Protection, or open the Production URL while logged out to confirm APIs are public.',
        data,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        source: '@aq-architect/serverless-gateway',
        gatewayStatus: 'error',
        error: (data as { detail?: string; error?: string })?.detail
          || (data as { error?: string })?.error
          || 'Agent core failure',
        data,
      });
    }

    return res.status(200).json({
      source: '@aq-architect/serverless-gateway',
      gatewayStatus: 'synchronized',
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      source: '@aq-architect/serverless-gateway',
      gatewayStatus: 'error',
      error: `Serverless bridge failure: ${message}`,
    });
  }
}
