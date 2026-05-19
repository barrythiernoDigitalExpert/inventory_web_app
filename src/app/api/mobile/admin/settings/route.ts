/**
 * Mobile Admin Settings — Pin Retention Configuration
 * ─────────────────────────────────────────────────────
 * GET   /api/mobile/admin/settings
 * PATCH /api/mobile/admin/settings
 *
 * Auth: JWT Bearer, ADMIN role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

const PIN_RETENTION_KEY = 'pin_retention_days';
const DEFAULT_RETENTION_DAYS = 30;

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;

    if (authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: PIN_RETENTION_KEY },
    });

    return NextResponse.json({
      success: true,
      data: {
        pinRetentionDays: config ? parseInt(config.value) : DEFAULT_RETENTION_DAYS,
        updatedAt: config?.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('[mobile/admin/settings] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;

    if (authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pinRetentionDays } = body;

    if (
      typeof pinRetentionDays !== 'number' ||
      !Number.isInteger(pinRetentionDays) ||
      pinRetentionDays < 1 ||
      pinRetentionDays > 365
    ) {
      return NextResponse.json(
        { success: false, error: 'pinRetentionDays must be an integer between 1 and 365' },
        { status: 400 }
      );
    }

    const updated = await prisma.systemConfig.upsert({
      where: { key: PIN_RETENTION_KEY },
      create: { key: PIN_RETENTION_KEY, value: String(pinRetentionDays) },
      update: { value: String(pinRetentionDays) },
    });

    return NextResponse.json({
      success: true,
      data: {
        pinRetentionDays,
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: `Pin retention period updated to ${pinRetentionDays} days.`,
    });
  } catch (error) {
    console.error('[mobile/admin/settings] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating settings' },
      { status: 500 }
    );
  }
}
