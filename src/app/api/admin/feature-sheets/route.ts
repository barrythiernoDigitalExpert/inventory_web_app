import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  createFeatureSheetForUserEmail,
  listFeatureSheetsForCrm,
  validateName,
  validateValuesObject,
} from '@/lib/services/featureSheetService';
import { parseAgentsJson } from '@/lib/services/crmCanvassingService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feature-sheets
 * POST /api/admin/feature-sheets
 *
 * Auth : Bearer {MAILDROP_ADMIN_TOKEN}
 */
export async function GET(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get('scope');
    const agentsJson = searchParams.get('agentsJson');
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
        { message: 'Paramètre requis : scope=all ou agentsJson' },
        { status: 422 }
      );
    }

    const data = await listFeatureSheetsForCrm({ scope, agents, limit, offset });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/feature-sheets] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    let body: { name?: unknown; values?: unknown; ownerEmail?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!validateName(body.name)) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }

    if (typeof body.ownerEmail !== 'string' || !body.ownerEmail.trim()) {
      return NextResponse.json({ success: false, error: 'ownerEmail is required' }, { status: 400 });
    }

    const values = body.values === undefined ? {} : body.values;
    if (!validateValuesObject(values)) {
      return NextResponse.json(
        { success: false, error: 'values must be a non-array object' },
        { status: 400 }
      );
    }

    const sheet = await createFeatureSheetForUserEmail(
      body.ownerEmail,
      body.name as string,
      values
    );

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: 'Owner user not found for ownerEmail' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sheet }, { status: 201 });
  } catch (error) {
    console.error('[admin/feature-sheets] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
