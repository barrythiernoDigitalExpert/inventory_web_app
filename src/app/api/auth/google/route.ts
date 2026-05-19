import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/utils/prisma';
import { logger } from '@/lib/utils/logger';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

interface GoogleTokenInfo {
  iss: string;
  sub: string;        // Google user ID
  aud: string;        // Should match our GOOGLE_CLIENT_ID
  email: string;
  email_verified: string; // "true" or "false"
  name?: string;
  picture?: string;
  exp: string;
  iat: string;
}

/**
 * Verify a Google id_token server-side via Google's tokeninfo endpoint.
 * Returns the verified payload or throws on failure.
 */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  let res: Response;
  try {
    res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: controller.signal }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`Google token verification failed: HTTP ${res.status}`);
  }

  const payload: GoogleTokenInfo = await res.json();

  // Ensure the token was issued for our application
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new Error('Google token audience mismatch — possible token theft');
  }

  if (payload.email_verified !== 'true') {
    throw new Error('Google account email is not verified');
  }

  return payload;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, displayName } = body as {
      idToken?: string;
      displayName?: string;
    };

    if (!idToken) {
      return NextResponse.json(
        { message: 'idToken Google est requis' },
        { status: 400 }
      );
    }

    // ── Verify the Google id_token server-side ───────────────────────────────
    let tokenPayload: GoogleTokenInfo;
    try {
      tokenPayload = await verifyGoogleIdToken(idToken);
    } catch (err) {
      logger.warn('[AUTH/GOOGLE] id_token invalide', err);
      return NextResponse.json(
        { message: 'Token Google invalide ou expiré' },
        { status: 401 }
      );
    }

    const { email, sub: uid } = tokenPayload;
    const verifiedName = displayName || tokenPayload.name;

    // ── Database lookup ──────────────────────────────────────────────────────
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "Aucun compte associé à cet email Google. Contactez l'administration." },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "Votre compte est inactif. Veuillez contacter l'administration." },
        { status: 403 }
      );
    }

    // Update Google info if needed
    if (user.authType === 'LOCAL' || user.googleId !== uid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: uid,
          authType: 'GOOGLE',
          ...(verifiedName && { name: verifiedName }),
        },
      });
    }

    // ── Issue JWT ────────────────────────────────────────────────────────────
    const token = await new SignJWT({
      id: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    logger.info('[AUTH/GOOGLE] Login réussi', { userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    logger.error("[AUTH/GOOGLE] Erreur d'authentification", error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
