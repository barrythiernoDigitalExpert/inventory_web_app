import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  CrmUserError,
  revokeCrmPlatformUser,
  updateCrmPlatformUserStatus,
} from '@/lib/services/crmUserService';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/{userId}
 *
 * Active ou révoque un utilisateur.
 *
 * Body JSON : { "isActive": true | false }
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await props.params;
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json({ message: 'userId invalide' }, { status: 422 });
    }

    const body = await request.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'Champ "isActive" (boolean) requis' },
        { status: 422 }
      );
    }

    const user = await updateCrmPlatformUserStatus({ userId: id }, body.isActive);
    return NextResponse.json({ data: { user } });
  } catch (error) {
    if (error instanceof CrmUserError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error('[admin/users] PATCH error:', error);
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
 * DELETE /api/admin/users/{userId}
 *
 * Révoque un utilisateur (désactivation, isActive=false).
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await props.params;
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      return NextResponse.json({ message: 'userId invalide' }, { status: 422 });
    }

    const user = await revokeCrmPlatformUser({ userId: id });
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
