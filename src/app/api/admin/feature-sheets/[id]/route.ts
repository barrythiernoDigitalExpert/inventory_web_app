import { NextRequest, NextResponse } from 'next/server';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  deleteFeatureSheet,
  getFeatureSheetByIdAdmin,
  updateFeatureSheet,
  validateName,
  validateValuesObject,
} from '@/lib/services/featureSheetService';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET / PATCH / PUT / DELETE /api/admin/feature-sheets/{id}
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const authError = verifyMaildropAdminAuth(_request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const sheet = await getFeatureSheetByIdAdmin(sheetId);
    if (!sheet) {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sheet });
  } catch (error) {
    console.error('[admin/feature-sheets/id] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
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

    const result = await updateFeatureSheet(sheetId, 0, 'ADMIN', {
      name: body.name as string | undefined,
      values: body.values as Record<string, unknown> | undefined,
      mergeValues: body.mergeValues === true,
      removeKeys,
    });

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[admin/feature-sheets/id] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
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

    const result = await updateFeatureSheet(sheetId, 0, 'ADMIN', {
      name: body.name as string,
      values: (body.values ?? {}) as Record<string, unknown>,
      mergeValues: false,
    });

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[admin/feature-sheets/id] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const authError = verifyMaildropAdminAuth(_request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const sheetId = parseInt(id, 10);
    if (Number.isNaN(sheetId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const result = await deleteFeatureSheet(sheetId, 0, 'ADMIN');

    if (result === 'not_found') {
      return NextResponse.json({ success: false, error: 'Feature sheet not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Feature sheet deleted' });
  } catch (error) {
    console.error('[admin/feature-sheets/id] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
