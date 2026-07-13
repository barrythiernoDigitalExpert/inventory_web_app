import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { CrmAgent } from '@/lib/services/crmCanvassingService';

export interface FeatureSheetOwner {
  id: number;
  name: string;
  email: string;
}

export interface FeatureSheetData {
  id: number;
  name: string;
  values: Record<string, unknown>;
  schemaVersion: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  owner?: FeatureSheetOwner;
}

export interface FeatureSheetListResult {
  sheets: FeatureSheetData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function parseValuesJson(values: unknown): Record<string, unknown> {
  if (values && typeof values === 'object' && !Array.isArray(values)) {
    return values as Record<string, unknown>;
  }
  return {};
}

function formatSheet(
  row: {
    id: number;
    name: string;
    values: unknown;
    schemaVersion: number;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    user?: { id: number; name: string; email: string };
  },
  includeOwner = false
): FeatureSheetData {
  return {
    id: row.id,
    name: row.name,
    values: parseValuesJson(row.values),
    schemaVersion: row.schemaVersion,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(includeOwner && row.user
      ? {
          owner: {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          },
        }
      : {}),
  };
}

export function validateValuesObject(values: unknown): values is Record<string, unknown> {
  return !!values && typeof values === 'object' && !Array.isArray(values);
}

export function validateName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255;
}

export async function listFeatureSheetsForUser(
  userId: number,
  userRole: string,
  limit = 100,
  offset = 0
): Promise<FeatureSheetListResult> {
  const where: Prisma.FeatureSheetWhereInput =
    userRole === 'ADMIN' ? {} : { userId };

  const [total, rows] = await Promise.all([
    prisma.featureSheet.count({ where }),
    prisma.featureSheet.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 500),
      skip: offset,
      include: userRole === 'ADMIN' ? { user: { select: { id: true, name: true, email: true } } } : undefined,
    }),
  ]);

  return {
    sheets: rows.map((row) => formatSheet(row, userRole === 'ADMIN')),
    pagination: {
      total,
      limit: Math.min(limit, 500),
      offset,
      hasMore: offset + Math.min(limit, 500) < total,
    },
  };
}

export async function listFeatureSheetsForCrm(params: {
  scope: 'all' | 'agents';
  agents: CrmAgent[] | null;
  limit?: number;
  offset?: number;
}): Promise<FeatureSheetListResult> {
  const limit = Math.min(params.limit ?? 500, 500);
  const offset = params.offset ?? 0;

  const where: Prisma.FeatureSheetWhereInput = {};
  if (params.scope === 'agents' && params.agents?.length) {
    where.user = {
      email: {
        in: params.agents.map((a) => a.email),
        mode: 'insensitive',
      },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.featureSheet.count({ where }),
    prisma.featureSheet.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    sheets: rows.map((row) => formatSheet(row, true)),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

export async function getFeatureSheetById(
  id: number,
  userId: number,
  userRole: string
): Promise<FeatureSheetData | null> {
  const row = await prisma.featureSheet.findUnique({
    where: { id },
    include: userRole === 'ADMIN' ? { user: { select: { id: true, name: true, email: true } } } : undefined,
  });

  if (!row) return null;
  if (userRole !== 'ADMIN' && row.userId !== userId) return null;

  return formatSheet(row, userRole === 'ADMIN');
}

export async function getFeatureSheetByIdAdmin(id: number): Promise<FeatureSheetData | null> {
  const row = await prisma.featureSheet.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return row ? formatSheet(row, true) : null;
}

export async function createFeatureSheet(
  userId: number,
  name: string,
  values: Record<string, unknown> = {}
): Promise<FeatureSheetData> {
  const row = await prisma.featureSheet.create({
    data: {
      name: name.trim(),
      values: values as Prisma.InputJsonValue,
      userId,
    },
  });

  return formatSheet(row);
}

export async function createFeatureSheetForUserEmail(
  ownerEmail: string,
  name: string,
  values: Record<string, unknown> = {}
): Promise<FeatureSheetData | null> {
  const user = await prisma.user.findUnique({
    where: { email: ownerEmail.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  if (!user) return null;

  const row = await prisma.featureSheet.create({
    data: {
      name: name.trim(),
      values: values as Prisma.InputJsonValue,
      userId: user.id,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return formatSheet(row, true);
}

export async function updateFeatureSheet(
  id: number,
  userId: number,
  userRole: string,
  updates: {
    name?: string;
    values?: Record<string, unknown>;
    mergeValues?: boolean;
    removeKeys?: string[];
  }
): Promise<FeatureSheetData | 'not_found' | 'forbidden'> {
  const existing = await prisma.featureSheet.findUnique({ where: { id } });
  if (!existing) return 'not_found';
  if (userRole !== 'ADMIN' && existing.userId !== userId) return 'forbidden';

  const data: Prisma.FeatureSheetUpdateInput = {};

  if (updates.name !== undefined) {
    data.name = updates.name.trim();
  }

  if (updates.values !== undefined || updates.removeKeys?.length) {
    const current = parseValuesJson(existing.values);
    let next = { ...current };

    if (updates.mergeValues && updates.values) {
      next = { ...next, ...updates.values };
    } else if (updates.values !== undefined) {
      next = { ...updates.values };
    }

    if (updates.removeKeys?.length) {
      for (const key of updates.removeKeys) {
        delete next[key];
      }
    }

    data.values = next as Prisma.InputJsonValue;
  }

  const row = await prisma.featureSheet.update({
    where: { id },
    data,
    include: userRole === 'ADMIN' ? { user: { select: { id: true, name: true, email: true } } } : undefined,
  });

  return formatSheet(row, userRole === 'ADMIN');
}

export async function deleteFeatureSheet(
  id: number,
  userId: number,
  userRole: string
): Promise<'deleted' | 'not_found' | 'forbidden'> {
  const existing = await prisma.featureSheet.findUnique({ where: { id } });
  if (!existing) return 'not_found';
  if (userRole !== 'ADMIN' && existing.userId !== userId) return 'forbidden';

  await prisma.featureSheet.delete({ where: { id } });
  return 'deleted';
}
