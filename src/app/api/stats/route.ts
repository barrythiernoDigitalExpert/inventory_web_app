// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import { getStatsPayload } from '@/lib/services/statsApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 *
 * Team Performance — app mobile (JWT admin).
 * Query : period, userId (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    if (authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Admin privileges required.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const userId = searchParams.get('userId');

    const payload = await getStatsPayload(period, userId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching dashboard statistics',
      },
      { status: 500 }
    );
  }
}
