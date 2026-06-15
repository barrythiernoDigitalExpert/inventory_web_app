import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import { getStatsPayload } from '@/lib/services/statsApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 *
 * Statistiques Team Performance pour toute l'équipe (admin Maildrop / CRM).
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 *
 * Query params :
 *   period → all | today | week | month | last3months | quarter | year (défaut : month)
 */
export async function GET(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const payload = await getStatsPayload(period, null);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching dashboard statistics',
      },
      { status: 500 }
    );
  }
}
