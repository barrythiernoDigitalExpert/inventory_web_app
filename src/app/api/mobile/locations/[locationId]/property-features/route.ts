/**
 * Mobile – Property Features
 * ──────────────────────────
 * Routes: GET / PUT / PATCH / DELETE
 * Auth  : JWT Bearer (mobile)
 * Param : locationId = server Property.id (integer)
 *
 * The mobile app stores features as a flat JSON object { key: value }.
 * These routes persist / retrieve that blob in the `property_features_data`
 * table without touching the structured PropertyPropertyFeature EAV model
 * used by the web app.
 *
 * Conflict strategy: last-write-wins using `clientUpdatedAt`.
 * If `clientUpdatedAt` < `server.updatedAt` → return 409 with current
 * server data so the mobile can decide to merge or overwrite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import { logger } from '@/lib/utils/logger';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the property if the authenticated user has read access, null otherwise. */
async function resolveProperty(locationId: string, userId: number, userRole: string) {
  const propertyId = parseInt(locationId);
  if (isNaN(propertyId)) return null;

  if (userRole === 'ADMIN') {
    return prisma.property.findUnique({ where: { id: propertyId } });
  }

  return prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { userId },
        { sharedWith: { some: { userId } } },
      ],
    },
  });
}

/** Builds the standard response payload. */
function buildPayload(locationId: number, data: { features: unknown; updatedAt: Date; schemaVersion: number } | null) {
  return {
    success: true,
    data: {
      locationId: String(locationId),
      features: (data?.features ?? {}) as Record<string, unknown>,
      updatedAt: data?.updatedAt ?? null,
      schemaVersion: data?.schemaVersion ?? 1,
    },
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/mobile/locations/:locationId/property-features
 *
 * Returns the flat features object for the given location.
 * Responds with { features: {} } when no data has been saved yet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { locationId } = await params;

    const property = await resolveProperty(locationId, user.id, user.role);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Location not found or access denied' },
        { status: 404 }
      );
    }

    const data = await prisma.propertyFeaturesData.findUnique({
      where: { propertyId: property.id },
      select: { features: true, updatedAt: true, schemaVersion: true },
    });

    return NextResponse.json(buildPayload(property.id, data));
  } catch (error) {
    logger.error('[mobile/property-features] GET error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

/**
 * PUT /api/mobile/locations/:locationId/property-features
 *
 * Full replacement of the features object (upsert).
 *
 * Body: { features: Record<string, unknown>, clientUpdatedAt?: string }
 *
 * Conflict resolution:
 *   If `clientUpdatedAt` is provided and server record is newer → 409 Conflict.
 *   Otherwise → last-write-wins (overwrite).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { locationId } = await params;

    const property = await resolveProperty(locationId, user.id, user.role);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Location not found or access denied' },
        { status: 404 }
      );
    }

    // Check write permission for shared properties
    if (property.userId !== user.id && user.role !== 'ADMIN') {
      const share = await prisma.propertyShare.findUnique({
        where: { propertyId_userId: { propertyId: property.id, userId: user.id } },
        select: { canEdit: true },
      });
      if (!share?.canEdit) {
        return NextResponse.json(
          { success: false, error: 'You do not have write access to this location' },
          { status: 403 }
        );
      }
    }

    let body: { features?: unknown; clientUpdatedAt?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.features || typeof body.features !== 'object' || Array.isArray(body.features)) {
      return NextResponse.json(
        { success: false, error: '`features` must be a non-array object' },
        { status: 400 }
      );
    }

    // Conflict check: if the client provides its timestamp, compare with the server record
    if (body.clientUpdatedAt) {
      const clientTs = new Date(body.clientUpdatedAt);
      const existing = await prisma.propertyFeaturesData.findUnique({
        where: { propertyId: property.id },
        select: { features: true, updatedAt: true, schemaVersion: true },
      });
      if (existing && existing.updatedAt > clientTs) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error: 'Server data is more recent than client data',
            serverData: buildPayload(property.id, existing).data,
          },
          { status: 409 }
        );
      }
    }

    const saved = await prisma.propertyFeaturesData.upsert({
      where: { propertyId: property.id },
      create: {
        propertyId: property.id,
        features: body.features as object,
        updatedByUserId: user.id,
      },
      update: {
        features: body.features as object,
        updatedByUserId: user.id,
      },
      select: { features: true, updatedAt: true, schemaVersion: true },
    });

    logger.info('[mobile/property-features] PUT saved', { propertyId: property.id, userId: user.id });

    return NextResponse.json(buildPayload(property.id, saved));
  } catch (error) {
    logger.error('[mobile/property-features] PUT error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/mobile/locations/:locationId/property-features
 *
 * Deep-merge the provided keys into the existing features object.
 * Keys not in the body are left untouched.
 *
 * Body: { features: Record<string, unknown>, clientUpdatedAt?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { locationId } = await params;

    const property = await resolveProperty(locationId, user.id, user.role);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Location not found or access denied' },
        { status: 404 }
      );
    }

    // Check write permission for shared properties
    if (property.userId !== user.id && user.role !== 'ADMIN') {
      const share = await prisma.propertyShare.findUnique({
        where: { propertyId_userId: { propertyId: property.id, userId: user.id } },
        select: { canEdit: true },
      });
      if (!share?.canEdit) {
        return NextResponse.json(
          { success: false, error: 'You do not have write access to this location' },
          { status: 403 }
        );
      }
    }

    let body: { features?: unknown; clientUpdatedAt?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.features || typeof body.features !== 'object' || Array.isArray(body.features)) {
      return NextResponse.json(
        { success: false, error: '`features` must be a non-array object' },
        { status: 400 }
      );
    }

    const incoming = body.features as Record<string, unknown>;

    // Read existing record to merge
    const existing = await prisma.propertyFeaturesData.findUnique({
      where: { propertyId: property.id },
      select: { features: true, updatedAt: true, schemaVersion: true },
    });

    // Optional conflict guard
    if (body.clientUpdatedAt && existing && existing.updatedAt > new Date(body.clientUpdatedAt)) {
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          error: 'Server data is more recent than client data',
          serverData: buildPayload(property.id, existing).data,
        },
        { status: 409 }
      );
    }

    const merged: Record<string, unknown> = {
      ...((existing?.features as Record<string, unknown>) ?? {}),
      ...incoming,
    };
    // Prisma requires the Json field to be cast via `as any` when the shape is unknown
    const mergedJson = merged as Parameters<typeof prisma.propertyFeaturesData.upsert>[0]['create']['features'];

    const saved = await prisma.propertyFeaturesData.upsert({
      where: { propertyId: property.id },
      create: {
        propertyId: property.id,
        features: mergedJson,
        updatedByUserId: user.id,
      },
      update: {
        features: mergedJson,
        updatedByUserId: user.id,
      },
      select: { features: true, updatedAt: true, schemaVersion: true },
    });

    logger.info('[mobile/property-features] PATCH merged', { propertyId: property.id, userId: user.id, keys: Object.keys(incoming) });

    return NextResponse.json(buildPayload(property.id, saved));
  } catch (error) {
    logger.error('[mobile/property-features] PATCH error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/mobile/locations/:locationId/property-features
 *
 * Resets the features to an empty object `{}`.
 * Does NOT delete the row — keeps the record for audit purposes.
 * Only the property owner or an admin can delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const { locationId } = await params;

    const property = await resolveProperty(locationId, user.id, user.role);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Location not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    if (property.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only the property owner or an admin can reset features' },
        { status: 403 }
      );
    }

    const saved = await prisma.propertyFeaturesData.upsert({
      where: { propertyId: property.id },
      create: {
        propertyId: property.id,
        features: {},
        updatedByUserId: user.id,
      },
      update: {
        features: {},
        updatedByUserId: user.id,
      },
      select: { features: true, updatedAt: true, schemaVersion: true },
    });

    logger.info('[mobile/property-features] DELETE reset', { propertyId: property.id, userId: user.id });

    return NextResponse.json(buildPayload(property.id, saved));
  } catch (error) {
    logger.error('[mobile/property-features] DELETE error', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
