import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import {
  createFeatureSheet,
  listFeatureSheetsForUser,
  validateName,
  validateValuesObject,
} from '@/lib/services/featureSheetService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/feature-sheets
 * POST /api/mobile/feature-sheets
 *
 * Fiches features indépendantes des properties.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await listFeatureSheetsForUser(user.id, user.role, limit, offset);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[mobile/feature-sheets] GET error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    let body: { name?: unknown; values?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!validateName(body.name)) {
      return NextResponse.json(
        { success: false, error: 'name is required (non-empty string, max 255 chars)' },
        { status: 400 }
      );
    }

    const values = body.values === undefined ? {} : body.values;
    if (!validateValuesObject(values)) {
      return NextResponse.json(
        { success: false, error: 'values must be a non-array object' },
        { status: 400 }
      );
    }

    const sheet = await createFeatureSheet(user.id, body.name, values);

    return NextResponse.json({ success: true, data: sheet }, { status: 201 });
  } catch (error) {
    logger.error('[mobile/feature-sheets] POST error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
