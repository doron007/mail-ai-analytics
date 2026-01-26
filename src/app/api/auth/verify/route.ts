import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken, AUTH_CONFIG } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=missing_token', request.url));
    }

    // Verify the magic link token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.redirect(new URL('/auth?error=invalid_or_expired', request.url));
    }

    // Generate a new long-lived session token
    const sessionToken = generateToken(payload.email, AUTH_CONFIG.tokenExpiration);

    // Create response with redirect to home
    const response = NextResponse.redirect(new URL('/', request.url));

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
    return NextResponse.redirect(new URL('/auth?error=verification_failed', request.url));
  }
}
