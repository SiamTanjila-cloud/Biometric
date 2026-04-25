import { NextRequest } from 'next/server';

export const RP_NAME = 'AI Studio Passkeys Demo';

export function getRPInfo(req: NextRequest) {
  // If APP_URL is defined (e.g. deployed app), use that as the source of truth
  if (process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL);
      return {
        rpID: url.hostname,
        expectedOrigin: process.env.APP_URL.endsWith('/') 
          ? process.env.APP_URL.slice(0, -1) 
          : process.env.APP_URL
      };
    } catch {}
  }
  
  // Fallback to the request Host header if no APP_URL is set (e.g. dev)
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  return {
    rpID: host.split(':')[0], // Drop the port
    expectedOrigin: `${protocol}://${host}`
  };
}
