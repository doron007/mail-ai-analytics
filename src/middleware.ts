import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple token verification for middleware (can't use crypto in edge runtime)
function verifyTokenSimple(token: string): boolean {
  try {
    const [payloadBase64] = token.split('.');
    if (!payloadBase64) return false;

    const payload = JSON.parse(atob(payloadBase64));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration and email
    return payload.exp > now && payload.email === 'doronhetz@sef.energy';
  } catch {
    return false;
  }
}

/**
 * Get the base URL for redirects.
 * Azure Container Apps does NOT forward X-Forwarded-Host, so we use APP_URL env var.
 */
function getBaseUrl(request: NextRequest): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// Routes that don't require authentication
const publicPaths = [
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/icon.svg',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('mail_ai_auth')?.value;

  if (!authCookie || !verifyTokenSimple(authCookie)) {
    // Redirect to auth page
    const baseUrl = getBaseUrl(request);
    const authUrl = new URL('/auth', baseUrl);
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (browser icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
