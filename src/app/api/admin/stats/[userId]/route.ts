import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import { getStatsPayload } from '@/lib/services/statsApiService';
import { prisma } from '@/lib/utils/prisma';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ userId: string }> };

/**
 * GET /api/admin/stats/{userId}
 *
 * Statistiques Team Performance pour un membre Maildrop (admin / CRM).
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 *
 * Query params :
 *   period → all | today | week | month | last3months | quarter | year (défaut : month)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await params;
    const parsedUserId = parseInt(userId, 10);

    if (Number.isNaN(parsedUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const payload = await getStatsPayload(period, String(parsedUserId));
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching admin user stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching dashboard statistics',
      },
      { status: 500 }
    );
  }
}
