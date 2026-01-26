import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken, AUTH_CONFIG } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const baseUrl = getBaseUrl(request);

    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=missing_token', baseUrl));
    }

    // Verify the magic link token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.redirect(new URL('/auth?error=invalid_or_expired', baseUrl));
    }

    // Generate a new long-lived session token
    const sessionToken = generateToken(payload.email, AUTH_CONFIG.tokenExpiration);

    // Create response with redirect to home
    const response = NextResponse.redirect(new URL('/', baseUrl));

    // Set the auth cookie
    response.cookies.set(AUTH_CONFIG.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_CONFIG.tokenExpiration,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth verify error:', error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(new URL('/auth?error=verification_failed', baseUrl));
  }
}
