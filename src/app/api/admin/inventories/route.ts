import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  getCrmInventoryData,
  parseAgentsJson,
} from '@/lib/services/crmInventoryService';
import { Period } from '@/lib/utils/periodFilter';

/**
 * GET /api/admin/inventories
 *
 * Route CRM — inventaires (properties) et statistiques globales.
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 *
 * Query params :
 *   scope=all          → tous les inventaires
 *   agentsJson=[...]   → filtre par email(s) propriétaire (JSON URL-encoded)
 *   period             → all | today | week | month | custom
 *   startDate, endDate → si period=custom (YYYY-MM-DD)
 *   limit              → max 500 (défaut 500)
 *   offset             → pagination
 */
export async function GET(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get('scope');
    const agentsJson = searchParams.get('agentsJson');
    const period = (searchParams.get('period') || 'all') as Period;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const agents = parseAgentsJson(agentsJson);

    let scope: 'all' | 'agents';
    if (scopeParam === 'all') {
      scope = 'all';
    } else if (agents) {
      scope = 'agents';
    } else {
      return NextResponse.json(
        {
          message:
            'Paramètre requis : scope=all ou agentsJson avec au moins un agent (email)',
        },
        { status: 422 }
      );
    }

    if (period === 'custom' && (!startDate || !endDate)) {
      return NextResponse.json(
        { message: 'startDate et endDate requis lorsque period=custom' },
        { status: 422 }
      );
    }

    const data = await getCrmInventoryData({
      scope,
      agents,
      period,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      data: {
        inventories: data.inventories,
        stats: data.stats,
        pagination: data.pagination,
      },
    });
  } catch (error) {
    console.error('[admin/inventories] GET error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
