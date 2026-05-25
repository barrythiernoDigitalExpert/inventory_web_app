import { Prisma, ResponseType } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { buildDateRangeFilter, Period } from '@/lib/utils/periodFilter';

export interface CrmAgent {
  crmUserId?: number;
  email: string;
  name: string;
}

export interface CrmVisitUser {
  crmEmail: string;
  userName: string;
  maildropUserId: number;
  crmUserId?: number;
}

export interface CrmVisit {
  id: string;
  latitude: number;
  longitude: number;
  houseName: string;
  streetAddress: string | null;
  neighborhood: string | null;
  city: string | null;
  contactMethod: string;
  responseReceived: string | null;
  comments: string | null;
  createdAt: Date;
  visitUsers: CrmVisitUser[];
}

export interface CrmPeriodStats {
  totalVisits: number;
  positiveResponses: number;
  negativeResponses: number;
  pendingResponses: number;
  noResponseResponses: number;
  responseRate: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAgentsJson(raw: string | null): CrmAgent[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    const agents: CrmAgent[] = [];
    for (const item of parsed) {
      if (!item || typeof item.email !== 'string' || !item.email.trim()) {
        continue;
      }
      agents.push({
        crmUserId: typeof item.crmUserId === 'number' ? item.crmUserId : undefined,
        email: normalizeEmail(item.email),
        name: typeof item.name === 'string' ? item.name : item.email,
      });
    }

    return agents.length > 0 ? agents : null;
  } catch {
    return null;
  }
}

function buildWhereClause(
  scope: 'all' | 'agents',
  agents: CrmAgent[] | null,
  period: Period,
  startDate?: string | null,
  endDate?: string | null
): Prisma.CanvassingVisitWhereInput {
  const where: Prisma.CanvassingVisitWhereInput = {};

  const dateFilter = buildDateRangeFilter(period, startDate, endDate);
  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  if (scope === 'agents' && agents) {
    const emails = agents.map((a) => a.email);
    where.visitUsers = {
      some: {
        user: {
          email: { in: emails, mode: 'insensitive' },
        },
      },
    };
  }

  return where;
}

function formatVisitUsers(
  visitUsers: Array<{
    userName: string;
    user: { id: number; email: string; name: string };
  }>,
  agentsByEmail: Map<string, CrmAgent>
): CrmVisitUser[] {
  return visitUsers.map((vu) => {
    const crmEmail = normalizeEmail(vu.user.email);
    const agent = agentsByEmail.get(crmEmail);
    return {
      crmEmail,
      userName: vu.userName || vu.user.name,
      maildropUserId: vu.user.id,
      ...(agent?.crmUserId !== undefined ? { crmUserId: agent.crmUserId } : {}),
    };
  });
}

export async function getCrmCanvassingData(params: {
  scope: 'all' | 'agents';
  agents: CrmAgent[] | null;
  period: Period;
  startDate?: string | null;
  endDate?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{
  visits: CrmVisit[];
  periodStats: CrmPeriodStats;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const { scope, agents, period, startDate, endDate } = params;
  const limit = Math.min(params.limit ?? 500, 500);
  const offset = params.offset ?? 0;

  const where = buildWhereClause(scope, agents, period, startDate, endDate);
  const agentsByEmail = new Map(
    (agents ?? []).map((a) => [a.email, a])
  );

  const [
    total,
    positiveResponses,
    negativeResponses,
    pendingResponses,
    noResponseResponses,
    visits,
  ] = await Promise.all([
    prisma.canvassingVisit.count({ where }),
    prisma.canvassingVisit.count({
      where: { ...where, responseReceived: ResponseType.positive },
    }),
    prisma.canvassingVisit.count({
      where: { ...where, responseReceived: ResponseType.negative },
    }),
    prisma.canvassingVisit.count({
      where: { ...where, responseReceived: ResponseType.pending },
    }),
    prisma.canvassingVisit.count({
      where: { ...where, responseReceived: ResponseType.no_response },
    }),
    prisma.canvassingVisit.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        houseName: true,
        streetAddress: true,
        neighborhood: true,
        city: true,
        contactMethod: true,
        responseReceived: true,
        comments: true,
        createdAt: true,
        visitUsers: {
          select: {
            userName: true,
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  const responded = positiveResponses + negativeResponses;
  const responseRate =
    total > 0 ? Math.round((responded / total) * 1000) / 10 : 0;

  return {
    visits: visits.map((visit) => ({
      id: visit.id,
      latitude: visit.latitude,
      longitude: visit.longitude,
      houseName: visit.houseName,
      streetAddress: visit.streetAddress,
      neighborhood: visit.neighborhood,
      city: visit.city,
      contactMethod: visit.contactMethod,
      responseReceived: visit.responseReceived,
      comments: visit.comments,
      createdAt: visit.createdAt,
      visitUsers: formatVisitUsers(visit.visitUsers, agentsByEmail),
    })),
    periodStats: {
      totalVisits: total,
      positiveResponses,
      negativeResponses,
      pendingResponses,
      noResponseResponses,
      responseRate,
    },
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}
