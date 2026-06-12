import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  createCrmPlatformUser,
  CrmUserError,
  listCrmPlatformUsers,
  revokeCrmPlatformUser,
} from '@/lib/services/crmUserService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 *
 * Liste tous les utilisateurs de la plateforme Maildrop.
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 *
 * Query params :
 *   isActive=true|false   → filtre par statut
 *   search                → recherche par nom ou email
 *   limit                 → max 500 (défaut 500)
 *   offset                → pagination
 */
export async function GET(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let isActive: boolean | undefined;
    if (isActiveParam === 'true') isActive = true;
    if (isActiveParam === 'false') isActive = false;

    const data = await listCrmPlatformUsers({
      isActive,
      search: search ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[admin/users] GET error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 *
 * Crée un utilisateur sur la plateforme.
 *
 * Body JSON :
 * {
 *   "name": "Jean Dupont",
 *   "email": "jean.dupont@example.com",
 *   "password": "secret123",
 *   "role": "USER"
 * }
 */
export async function POST(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const user = await createCrmPlatformUser({
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      password: String(body.password ?? ''),
      role: body.role ? String(body.role) : undefined,
    });

    return NextResponse.json({ data: { user } }, { status: 201 });
  } catch (error) {
    if (error instanceof CrmUserError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error('[admin/users] POST error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users?email=agent@example.com
 *
 * Révoque un utilisateur (désactivation, isActive=false).
 * Alternative à PATCH /api/admin/users/{userId} avec { "isActive": false }.
 */
export async function DELETE(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();

    if (!email) {
      return NextResponse.json(
        { message: 'Paramètre query "email" requis' },
        { status: 422 }
      );
    }

    const user = await revokeCrmPlatformUser({ email });
    return NextResponse.json({ data: { user } });
  } catch (error) {
    if (error instanceof CrmUserError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error('[admin/users] DELETE error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
