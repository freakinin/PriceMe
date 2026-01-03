// Vercel serverless function handler
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle health check
  if (req.url === '/api/health' || req.url === '/health') {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Handle other API routes
  return res.json({ 
    message: 'API endpoint - routes coming soon', 
    path: req.url 
  });
}
