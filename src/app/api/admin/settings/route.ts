/**
 * Admin Settings — Pin Retention Configuration
 * ─────────────────────────────────────────────
 * GET  /api/admin/settings  → read current pin_retention_days
 * PATCH /api/admin/settings → update pin_retention_days
 *
 * Auth: NextAuth session, ADMIN role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/utils/prisma';
import { authOptions } from '@/lib/utils/auth';

const PIN_RETENTION_KEY = 'pin_retention_days';
const DEFAULT_RETENTION_DAYS = 30;

async function getPinRetentionDays(): Promise<{ days: number; updatedAt: Date | null }> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: PIN_RETENTION_KEY },
  });
  return {
    days: config ? parseInt(config.value) : DEFAULT_RETENTION_DAYS,
    updatedAt: config?.updatedAt ?? null,
  };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { days, updatedAt } = await getPinRetentionDays();

    return NextResponse.json({
      success: true,
      data: {
        pinRetentionDays: days,
        updatedAt: updatedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('[admin/settings] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
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
    console.error('[admin/settings] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating settings' },
      { status: 500 }
    );
  }
}
