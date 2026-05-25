import { ContactMethod, Prisma, ResponseType } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { buildDateRangeFilter, Period } from '@/lib/utils/periodFilter';
import { v4 as uuidv4 } from 'uuid';

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
  /** URL Cloudinary — présent uniquement si la visite a une image */
  imagePath?: string;
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

type CrmVisitRow = {
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
  imagePath: string | null;
  visitUsers: Array<{
    userName: string;
    user: { id: number; email: string; name: string };
  }>;
};

function formatCrmVisit(
  visit: CrmVisitRow,
  agentsByEmail: Map<string, CrmAgent>
): CrmVisit {
  return {
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
    ...(visit.imagePath ? { imagePath: visit.imagePath } : {}),
    visitUsers: formatVisitUsers(visit.visitUsers, agentsByEmail),
  };
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
        imagePath: true,
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
    visits: visits.map((visit) => formatCrmVisit(visit, agentsByEmail)),
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

function normalizeContactMethod(method: string): string {
  if (method && method.toLowerCase() === 'maildrop') {
    return ContactMethod.BROCHURE;
  }
  return method.toUpperCase();
}

export function parseAgentFromBody(body: Record<string, unknown>): CrmAgent | null {
  const agent = body.agent;
  if (agent && typeof agent === 'object' && agent !== null) {
    const a = agent as Record<string, unknown>;
    if (typeof a.email === 'string' && a.email.trim()) {
      return {
        crmUserId: typeof a.crmUserId === 'number' ? a.crmUserId : undefined,
        email: normalizeEmail(a.email),
        name: typeof a.name === 'string' ? a.name : a.email,
      };
    }
  }

  if (typeof body.agentEmail === 'string' && body.agentEmail.trim()) {
    return {
      email: normalizeEmail(body.agentEmail),
      name:
        typeof body.agentName === 'string' && body.agentName.trim()
          ? body.agentName
          : body.agentEmail,
      crmUserId:
        typeof body.crmUserId === 'number' ? body.crmUserId : undefined,
    };
  }

  return null;
}

async function resolveMaildropUser(agent: CrmAgent) {
  return prisma.user.findFirst({
    where: {
      email: { equals: agent.email, mode: 'insensitive' },
      isActive: true,
    },
    select: { id: true, email: true, name: true },
  });
}

function mapVisitToCrmFormat(visit: CrmVisitRow, agent: CrmAgent): CrmVisit {
  return formatCrmVisit(visit, new Map([[agent.email, agent]]));
}

export class CrmCanvassingError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function createCrmCanvassingVisit(params: {
  agent: CrmAgent;
  latitude: number;
  longitude: number;
  contactMethod: string;
  contactMethod2?: string | null;
  contactMethod3?: string | null;
  contactMethod4?: string | null;
  houseName: string;
  vendorName?: string | null;
  comments?: string | null;
  streetAddress?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  postalCode?: string | null;
  imagePath?: string | null;
  mobileId?: string | null;
  createdAt?: string | null;
  responseReceived?: string | null;
  responseDate?: string | null;
}): Promise<CrmVisit> {
  const user = await resolveMaildropUser(params.agent);
  if (!user) {
    throw new CrmCanvassingError(
      `Aucun utilisateur Maildrop actif trouvé pour l'email : ${params.agent.email}`,
      404
    );
  }

  const mobileId = params.mobileId || uuidv4();

  if (params.mobileId) {
    const existing = await prisma.canvassingVisit.findFirst({
      where: { mobileId: params.mobileId },
    });
    if (existing) {
      throw new CrmCanvassingError(
        'Une visite avec ce mobileId existe déjà',
        409
      );
    }
  }

  const visit = await prisma.$transaction(async (tx) => {
    const created = await tx.canvassingVisit.create({
      data: {
        latitude: params.latitude,
        longitude: params.longitude,
        contactMethod: normalizeContactMethod(params.contactMethod) as ContactMethod,
        contactMethod2: params.contactMethod2
          ? (normalizeContactMethod(params.contactMethod2) as ContactMethod)
          : null,
        contactMethod3: params.contactMethod3
          ? (normalizeContactMethod(params.contactMethod3) as ContactMethod)
          : null,
        contactMethod4: params.contactMethod4
          ? (normalizeContactMethod(params.contactMethod4) as ContactMethod)
          : null,
        houseName: params.houseName,
        vendorName: params.vendorName || null,
        comments: params.comments || null,
        streetAddress: params.streetAddress || null,
        neighborhood: params.neighborhood || null,
        city: params.city || null,
        postalCode: params.postalCode || null,
        imagePath: params.imagePath || null,
        mobileId,
        createdAt: params.createdAt ? new Date(params.createdAt) : new Date(),
        responseReceived: (params.responseReceived as ResponseType) || null,
        responseDate: params.responseDate ? new Date(params.responseDate) : null,
        isSynced: true,
        syncedAt: new Date(),
      },
    });

    await tx.canvassingVisitUser.create({
      data: {
        visitId: created.id,
        userId: user.id,
        userName: params.agent.name || user.name || user.email,
        isCreator: true,
      },
    });

    return tx.canvassingVisit.findUniqueOrThrow({
      where: { id: created.id },
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
        imagePath: true,
        visitUsers: {
          select: {
            userName: true,
            user: { select: { id: true, email: true, name: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  });

  return mapVisitToCrmFormat(visit, params.agent);
}
