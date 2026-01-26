import { NextRequest, NextResponse } from 'next/server';
import { generateMagicLink, AUTH_CONFIG } from '@/lib/auth';

/**
 * Get the base URL for magic links.
 *
 * Azure Container Apps does NOT forward X-Forwarded-Host header (only X-Forwarded-Proto and X-Forwarded-For).
 * See: https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview
 *
 * Therefore, we use the APP_URL environment variable which is set during deployment
 * with the container app's public FQDN.
 */
function getBaseUrl(request: NextRequest): string {
  // 1. Prefer APP_URL environment variable (set in production by deployment script)
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // 2. Fallback for local development: use host header
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get the base URL for the magic link
    const baseUrl = getBaseUrl(request);

    // Generate the magic link
    const magicLink = generateMagicLink(baseUrl);

    // n8n webhook URL for sending auth emails
    const n8nWebhookUrl = 'https://n8n-sef.sef.energy/webhook/mail-ai-auth-email';

    // Send email via n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: AUTH_CONFIG.authorizedEmail,
        subject: 'Mail AI Analytics - Login Link',
        magicLink,
        expiresIn: '15 minutes',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send email via n8n:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to send login email' },
        { status: 500 }
      );
    }

    // Mask email for response (show first 2 chars and domain)
    const maskedEmail = AUTH_CONFIG.authorizedEmail.replace(
      /^(.{2}).*(@.*)$/,
      '$1***$2'
    );

    return NextResponse.json({
      success: true,
      message: 'Magic link sent',
      email: maskedEmail,
    });
  } catch (error) {
    console.error('Auth request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
