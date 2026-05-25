import { NextRequest, NextResponse } from 'next/server';

/**
 * Vérifie que la requête provient du CRM via Bearer MAILDROP_ADMIN_TOKEN.
 */
export function verifyMaildropAdminAuth(request: NextRequest): NextResponse | null {
  const adminToken = process.env.MAILDROP_ADMIN_TOKEN;

  if (!adminToken) {
    return NextResponse.json(
      { message: 'MAILDROP_ADMIN_TOKEN non configuré côté serveur' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== adminToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
