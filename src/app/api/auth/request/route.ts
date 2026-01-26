import { NextRequest, NextResponse } from 'next/server';
import { generateMagicLink, AUTH_CONFIG } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Generate the magic link
    const magicLink = generateMagicLink(baseUrl);

    // Send email via n8n webhook
    const n8nWebhookUrl = process.env.N8N_AUTH_EMAIL_WEBHOOK;

    if (!n8nWebhookUrl) {
      console.error('N8N_AUTH_EMAIL_WEBHOOK not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const emailResponse = await fetch(n8nWebhookUrl, {
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

    if (!emailResponse.ok) {
      console.error('Failed to send email via n8n:', await emailResponse.text());
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      email: AUTH_CONFIG.authorizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
    });
  } catch (error) {
    console.error('Auth request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
