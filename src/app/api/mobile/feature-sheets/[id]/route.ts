import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import {
  deleteFeatureSheet,
  getFeatureSheetById,
  updateFeatureSheet,
  validateName,
  validateValuesObject,
} from '@/lib/services/featureSheetService';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET / PATCH / PUT / DELETE /api/mobile/feature-sheets/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const sheet = await getFeatureSheetById(sheetId, user.id, user.role);
    if (!sheet) {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sheet });
  } catch (error) {
    logger.error('[mobile/feature-sheets/id] GET error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    let body: {
      name?: unknown;
      values?: unknown;
      mergeValues?: boolean;
      removeKeys?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.name !== undefined && !validateName(body.name)) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 });
    }

    if (body.values !== undefined && !validateValuesObject(body.values)) {
      return NextResponse.json(
        { success: false, error: 'values must be a non-array object' },
        { status: 400 }
      );
    }

    const removeKeys = Array.isArray(body.removeKeys)
      ? body.removeKeys.filter((k): k is string => typeof k === 'string')
      : undefined;

    if (
      body.name === undefined &&
      body.values === undefined &&
      (!removeKeys || removeKeys.length === 0)
    ) {
      return NextResponse.json(
        { success: false, error: 'Provide name, values, and/or removeKeys' },
        { status: 400 }
      );
    }

    const result = await updateFeatureSheet(sheetId, user.id, user.role, {
      name: body.name as string | undefined,
      values: body.values as Record<string, unknown> | undefined,
      mergeValues: body.mergeValues === true,
      removeKeys,
    });

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }
    if (result === 'forbidden') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[mobile/feature-sheets/id] PATCH error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    let body: { name?: unknown; values?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!validateName(body.name)) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }

    if (!validateValuesObject(body.values ?? {})) {
      return NextResponse.json(
        { success: false, error: 'values must be a non-array object' },
        { status: 400 }
      );
    }

    const result = await updateFeatureSheet(sheetId, user.id, user.role, {
      name: body.name as string,
      values: (body.values ?? {}) as Record<string, unknown>,
      mergeValues: false,
    });

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }
    if (result === 'forbidden') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[mobile/feature-sheets/id] PUT error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const result = await deleteFeatureSheet(sheetId, user.id, user.role);

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }
    if (result === 'forbidden') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Feature sheet deleted' });
  } catch (error) {
    logger.error('[mobile/feature-sheets/id] DELETE error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
