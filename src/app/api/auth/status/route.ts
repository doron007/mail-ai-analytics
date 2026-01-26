import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_CONFIG } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_CONFIG.cookieName)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      email: payload.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
