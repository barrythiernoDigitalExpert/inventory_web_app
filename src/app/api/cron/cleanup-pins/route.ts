/**
 * Cron — Cleanup Expired Pins
 * ────────────────────────────
 * POST /api/cron/cleanup-pins
 * Authorization: Bearer <CRON_SECRET>
 *
 * Triggered nightly at 02:00 UTC by Vercel Cron (see vercel.json).
 * Can also be called manually for testing / maintenance.
 *
 * Logic:
 *   1. Read pin_retention_days from SystemConfig (default 30)
 *   2. cutoffDate = now - retention_days
 *   3. Find users where isActive=false AND deactivatedAt < cutoffDate
 *      (users with deactivatedAt=null are NEVER deleted — safe by default)
 *   4. Find CanvassingVisit where the deactivated user is isCreator=true
 *   5. Delete those visits (cascade removes child rows automatically)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { logger } from '@/lib/utils/logger';

const PIN_RETENTION_KEY = 'pin_retention_days';
const DEFAULT_RETENTION_DAYS = 30;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // ── Authentication: Bearer <CRON_SECRET> ─────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error('[cron/cleanup-pins] CRON_SECRET is not configured');
    return NextResponse.json(
      { success: false, error: 'Cron job not properly configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── 1. Read retention setting ─────────────────────────────────────────
    const config = await prisma.systemConfig.findUnique({
      where: { key: PIN_RETENTION_KEY },
    });
    const retentionDays = config ? parseInt(config.value) : DEFAULT_RETENTION_DAYS;

    // ── 2. Compute cutoff date ────────────────────────────────────────────
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // ── 3. Find expired deactivated users ────────────────────────────────
    // Only users with an explicit deactivatedAt are eligible (null = never expires)
    const expiredUsers = await prisma.user.findMany({
      where: {
        isActive: false,
        deactivatedAt: { not: null, lt: cutoffDate },
      },
      select: { id: true },
    });

    if (expiredUsers.length === 0) {
      logger.info('[cron/cleanup-pins] No expired users found', { retentionDays, cutoffDate });
      return NextResponse.json({
        success: true,
        message: 'No expired pins to delete.',
        expiredUserCount: 0,
        deletedCount: 0,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        durationMs: Date.now() - startTime,
      });
    }

    const expiredUserIds = expiredUsers.map((u) => u.id);

    // ── 4. Find visits where the expired user is the creator ─────────────
    const visitsToDelete = await prisma.canvassingVisitUser.findMany({
      where: {
        userId: { in: expiredUserIds },
        isCreator: true,
      },
      select: { visitId: true },
    });

    const visitIds = [...new Set(visitsToDelete.map((v) => v.visitId))];

    if (visitIds.length === 0) {
      logger.info('[cron/cleanup-pins] Expired users found but no visits to delete', {
        expiredUserCount: expiredUsers.length,
      });
      return NextResponse.json({
        success: true,
        message: 'No expired pins to delete.',
        expiredUserCount: expiredUsers.length,
        deletedCount: 0,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        durationMs: Date.now() - startTime,
      });
    }

    // ── 5. Delete visits (cascade removes CanvassingVisitUser, ─────────────
    //       CanvassingVisitComment, VisitRevisit, Revisit)
    const { count: deletedCount } = await prisma.canvassingVisit.deleteMany({
      where: { id: { in: visitIds } },
    });

    const durationMs = Date.now() - startTime;

    logger.info('[cron/cleanup-pins] Cleanup complete', {
      expiredUserCount: expiredUsers.length,
      deletedCount,
      retentionDays,
      cutoffDate,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} expired pin(s).`,
      expiredUserCount: expiredUsers.length,
      deletedCount,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      durationMs,
    });
  } catch (error) {
    logger.error('[cron/cleanup-pins] Error during cleanup', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
}
