import { createHmac, randomBytes } from 'crypto';

// Auth configuration
export const AUTH_CONFIG = {
  // The only authorized email
  authorizedEmail: 'doronhetz@sef.energy',
  // Cookie name for storing the auth token
  cookieName: 'mail_ai_auth',
  // Token expiration (7 days in seconds)
  tokenExpiration: 7 * 24 * 60 * 60,
  // Magic link expiration (15 minutes in seconds)
  magicLinkExpiration: 15 * 60,
};

// Secret key for signing tokens (should be in env var in production)
const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET || 'mail-ai-analytics-secret-key-change-in-production';
  return secret;
};

interface TokenPayload {
  email: string;
  exp: number;
  iat: number;
  nonce: string;
}

// Generate a signed token
export function generateToken(email: string, expirationSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    email,
    exp: now + expirationSeconds,
    iat: now,
    nonce: randomBytes(8).toString('hex'),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSecretKey())
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

// Verify and decode a token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    // Verify signature
    const expectedSignature = createHmac('sha256', getSecretKey())
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString()
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    // Check authorized email
    if (payload.email !== AUTH_CONFIG.authorizedEmail) return null;

    return payload;
  } catch {
    return null;
  }
}

// Generate magic link URL
export function generateMagicLink(baseUrl: string): string {
  const token = generateToken(AUTH_CONFIG.authorizedEmail, AUTH_CONFIG.magicLinkExpiration);
  return `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

// Check if a request is authenticated
export function isAuthenticated(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return verifyToken(cookieValue) !== null;
}
