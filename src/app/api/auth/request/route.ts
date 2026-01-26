import { NextRequest, NextResponse } from 'next/server';
import { generateMagicLink, AUTH_CONFIG } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the base URL - prefer forwarded headers for production behind reverse proxy
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host') || new URL(request.url).host;

    // Use https in production, http only for localhost
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : forwardedProto;
    const baseUrl = `${protocol}://${host}`;

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
