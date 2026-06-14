import { Prisma, ResponseType } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';

/** Durée moyenne estimée par pin (visite initiale ou revisit) en minutes */
export const ESTIMATED_MINUTES_PER_PIN = 6;

/** Plafond fenêtre journalière (min–max timestamps) pour éviter les journées aberrantes */
const MAX_FIELD_WINDOW_MINUTES_PER_DAY = 12 * 60;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FieldTimeMetrics {
  totalPins: number;
  totalVisits: number;
  totalRevisits: number;
  /** Heures distinctes (0–23) avec ≥ 1 pin ou revisit */
  activeHoursDistinct: number;
  /** Somme par jour de (max − min) timestamps, plafonnée */
  fieldWindowMinutes: number;
  fieldWindowHours: number;
  /** totalPins × ESTIMATED_MINUTES_PER_PIN */
  estimatedFieldMinutes: number;
  estimatedFieldHours: number;
  /**
   * Temps moyen par pin :
   * - si ≥ 2 pins et fenêtre > 0 : fieldWindowMinutes / totalPins
   * - sinon : ESTIMATED_MINUTES_PER_PIN
   */
  averageMinutesPerPin: number;
  estimationMethod: 'field_window' | 'fixed_estimate' | 'none';
}

export interface RevisitsAggregate {
  totalRevisits: number;
  revisitsByResponseType: {
    positive: number;
    negative: number;
    no_response: number;
    pending: number;
  };
}

export interface TrendsAggregate {
  visitsTrend: number;
  itemsTrend: number;
  performanceTrend: number;
  locationsTrend: number;
  categoriesTrend: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calcTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100.0 : 0.0;
  }
  return round1(((current - previous) / previous) * 100);
}

export function getPreviousDateRange(period: string, now: Date): DateRange {
  const currentStart = getStartDateByPeriod(period, now);
  const currentEnd = getEndDateByPeriod(period, now);
  const durationMs = currentEnd.getTime() - currentStart.getTime();

  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  if (period === 'today') {
    previousStart.setHours(0, 0, 0, 0);
    previousEnd.setHours(23, 59, 59, 999);
  }

  return { start: previousStart, end: previousEnd };
}

export function getStartDateByPeriod(period: string, now: Date): Date {
  const startDate = new Date(now);

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'last3months': {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      startDate.setFullYear(currentYear);
      startDate.setMonth(currentMonth - 3);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return startDate;
}

export function getEndDateByPeriod(period: string, now: Date): Date {
  const endDate = new Date(now);

  switch (period) {
    case 'last3months': {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      endDate.setFullYear(currentYear);
      endDate.setMonth(currentMonth);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    default:
      break;
  }

  return endDate;
}

function buildDateFilter(startDate: Date, endDate?: Date) {
  return {
    gte: startDate,
    ...(endDate && { lte: endDate }),
  };
}

function buildVisitUserFilter(userId?: string | null) {
  return userId ? { visitUsers: { some: { userId: parseInt(userId, 10) } } } : {};
}

function buildRevisitUserFilter(userId?: string | null) {
  return userId ? { userId: parseInt(userId, 10) } : {};
}

function normalizeResponseKey(value: ResponseType | null): keyof RevisitsAggregate['revisitsByResponseType'] {
  if (value === ResponseType.positive) return 'positive';
  if (value === ResponseType.negative) return 'negative';
  if (value === ResponseType.pending) return 'pending';
  return 'no_response';
}

export async function getRevisitsAggregate(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<RevisitsAggregate> {
  const where = {
    createdAt: buildDateFilter(startDate, endDate),
    ...buildRevisitUserFilter(userId),
  };

  const [totalRevisits, grouped] = await Promise.all([
    prisma.revisit.count({ where }),
    prisma.revisit.groupBy({
      where,
      by: ['responseReceived'],
      _count: { id: true },
    }),
  ]);

  const revisitsByResponseType = {
    positive: 0,
    negative: 0,
    no_response: 0,
    pending: 0,
  };

  for (const row of grouped) {
    const key = normalizeResponseKey(row.responseReceived);
    revisitsByResponseType[key] = row._count.id;
  }

  return { totalRevisits, revisitsByResponseType };
}

export async function calculateFieldTimeMetrics(
  userId: number,
  startDate: Date,
  endDate?: Date
): Promise<FieldTimeMetrics> {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [visits, revisits] = await Promise.all([
    prisma.canvassingVisit.findMany({
      where: {
        createdAt: dateFilter,
        visitUsers: { some: { userId } },
      },
      select: { createdAt: true },
    }),
    prisma.revisit.findMany({
      where: {
        createdAt: dateFilter,
        userId,
      },
      select: { createdAt: true },
    }),
  ]);

  const totalVisits = visits.length;
  const totalRevisits = revisits.length;
  const totalPins = totalVisits + totalRevisits;

  if (totalPins === 0) {
    return {
      totalPins: 0,
      totalVisits: 0,
      totalRevisits: 0,
      activeHoursDistinct: 0,
      fieldWindowMinutes: 0,
      fieldWindowHours: 0,
      estimatedFieldMinutes: 0,
      estimatedFieldHours: 0,
      averageMinutesPerPin: 0,
      estimationMethod: 'none',
    };
  }

  const allTimestamps = [
    ...visits.map((v) => v.createdAt),
    ...revisits.map((r) => r.createdAt),
  ];

  const activeHourKeys = new Set(
    allTimestamps.map((t) => `${t.toISOString().slice(0, 10)}-${t.getUTCHours()}`)
  );

  const byDay = new Map<string, number[]>();
  for (const timestamp of allTimestamps) {
    const day = timestamp.toISOString().slice(0, 10);
    const existing = byDay.get(day) ?? [];
    existing.push(timestamp.getTime());
    byDay.set(day, existing);
  }

  let fieldWindowMinutes = 0;
  for (const times of byDay.values()) {
    if (times.length === 1) {
      fieldWindowMinutes += ESTIMATED_MINUTES_PER_PIN;
    } else {
      const span = (Math.max(...times) - Math.min(...times)) / 60000;
      fieldWindowMinutes += Math.min(span, MAX_FIELD_WINDOW_MINUTES_PER_DAY);
    }
  }

  const estimatedFieldMinutes = totalPins * ESTIMATED_MINUTES_PER_PIN;
  const averageMinutesPerPin =
    totalPins >= 2 && fieldWindowMinutes > 0
      ? round1(fieldWindowMinutes / totalPins)
      : ESTIMATED_MINUTES_PER_PIN;

  return {
    totalPins,
    totalVisits,
    totalRevisits,
    activeHoursDistinct: activeHourKeys.size,
    fieldWindowMinutes: Math.round(fieldWindowMinutes),
    fieldWindowHours: round1(fieldWindowMinutes / 60),
    estimatedFieldMinutes,
    estimatedFieldHours: round1(estimatedFieldMinutes / 60),
    averageMinutesPerPin,
    estimationMethod:
      totalPins >= 2 && fieldWindowMinutes > 0 ? 'field_window' : 'fixed_estimate',
  };
}

async function countVisitsInRange(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  return prisma.canvassingVisit.count({
    where: {
      createdAt: buildDateFilter(startDate, endDate),
      ...buildVisitUserFilter(userId),
    },
  });
}

async function countItemsInRange(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  return prisma.roomImage.count({
    where: {
      createdAt: buildDateFilter(startDate, endDate),
      ...(userId && { room: { property: { userId: parseInt(userId, 10) } } }),
    },
  });
}

async function countDistinctLocationsInRange(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  const where = {
    ...(userId && { userId: parseInt(userId, 10) }),
    updatedAt: buildDateFilter(startDate, endDate),
  };

  return prisma.property.count({ where });
}

async function countDistinctCategoriesInRange(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  const rooms = await prisma.room.findMany({
    where: {
      ...(userId && { property: { userId: parseInt(userId, 10) } }),
      images: {
        some: {
          createdAt: buildDateFilter(startDate, endDate),
        },
      },
    },
    select: { name: true },
    distinct: ['name'],
  });

  return rooms.length;
}

async function calcPerformanceRate(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  const where = {
    createdAt: buildDateFilter(startDate, endDate),
    ...buildVisitUserFilter(userId),
  };

  const [total, positive] = await Promise.all([
    prisma.canvassingVisit.count({ where }),
    prisma.canvassingVisit.count({
      where: { ...where, responseReceived: ResponseType.positive },
    }),
  ]);

  return total > 0 ? (positive / total) * 100 : 0;
}

export async function calculateTrendsForPeriods(
  current: DateRange,
  previous: DateRange,
  userId?: string | null
): Promise<TrendsAggregate> {
  const [
    currentVisits,
    previousVisits,
    currentItems,
    previousItems,
    currentPerformance,
    previousPerformance,
    currentLocations,
    previousLocations,
    currentCategories,
    previousCategories,
  ] = await Promise.all([
    countVisitsInRange(current.start, current.end, userId),
    countVisitsInRange(previous.start, previous.end, userId),
    countItemsInRange(current.start, current.end, userId),
    countItemsInRange(previous.start, previous.end, userId),
    calcPerformanceRate(current.start, current.end, userId),
    calcPerformanceRate(previous.start, previous.end, userId),
    countDistinctLocationsInRange(current.start, current.end, userId),
    countDistinctLocationsInRange(previous.start, previous.end, userId),
    countDistinctCategoriesInRange(current.start, current.end, userId),
    countDistinctCategoriesInRange(previous.start, previous.end, userId),
  ]);

  return {
    visitsTrend: calcTrendPercent(currentVisits, previousVisits),
    itemsTrend: calcTrendPercent(currentItems, previousItems),
    performanceTrend: calcTrendPercent(currentPerformance, previousPerformance),
    locationsTrend: calcTrendPercent(currentLocations, previousLocations),
    categoriesTrend: calcTrendPercent(currentCategories, previousCategories),
  };
}

export async function getCityStatsAggregate(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<
  Array<{
    city: string;
    country: string;
    totalVisits: number;
    positive: number;
    negative: number;
    noResponse: number;
    pending: number;
    totalRevisits: number;
    responseRate: number;
  }>
> {
  const dateFilter = buildDateFilter(startDate, endDate);
  const userFilter = userId ? parseInt(userId, 10) : null;

  const visits = await prisma.canvassingVisit.findMany({
    where: {
      createdAt: dateFilter,
      city: { not: null },
      ...(userFilter && { visitUsers: { some: { userId: userFilter } } }),
    },
    select: {
      city: true,
      responseReceived: true,
    },
  });

  const revisits = await prisma.revisit.findMany({
    where: {
      createdAt: dateFilter,
      city: { not: null },
      ...(userFilter && { userId: userFilter }),
    },
    select: {
      city: true,
      responseReceived: true,
    },
  });

  type CityBucket = {
    totalVisits: number;
    positive: number;
    negative: number;
    noResponse: number;
    pending: number;
    totalRevisits: number;
  };

  const buckets = new Map<string, CityBucket>();

  const ensure = (city: string): CityBucket => {
    const key = city.trim();
    if (!buckets.has(key)) {
      buckets.set(key, {
        totalVisits: 0,
        positive: 0,
        negative: 0,
        noResponse: 0,
        pending: 0,
        totalRevisits: 0,
      });
    }
    return buckets.get(key)!;
  };

  for (const visit of visits) {
    if (!visit.city) continue;
    const bucket = ensure(visit.city);
    bucket.totalVisits++;
    if (visit.responseReceived === ResponseType.positive) bucket.positive++;
    else if (visit.responseReceived === ResponseType.negative) bucket.negative++;
    else if (visit.responseReceived === ResponseType.pending) bucket.pending++;
    else bucket.noResponse++;
  }

  for (const revisit of revisits) {
    if (!revisit.city) continue;
    const bucket = ensure(revisit.city);
    bucket.totalRevisits++;
  }

  return Array.from(buckets.entries())
    .map(([city, stats]) => {
      const responded = stats.positive + stats.negative;
      return {
        city,
        country: '',
        totalVisits: stats.totalVisits,
        positive: stats.positive,
        negative: stats.negative,
        noResponse: stats.noResponse,
        pending: stats.pending,
        totalRevisits: stats.totalRevisits,
        responseRate:
          stats.totalVisits > 0
            ? round1((responded / stats.totalVisits) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.totalVisits - a.totalVisits);
}

export async function enrichVisitHoursWithResponses(
  userId: string | null | undefined,
  startDate: Date,
  endDate: Date | undefined
) {
  const rows = await prisma.$queryRaw<
    Array<{ hour: number; response_received: string | null; count: bigint }>
  >`
    SELECT
      EXTRACT(HOUR FROM created_at) AS hour,
      response_received,
      COUNT(*) AS count
    FROM canvassing_visits
    WHERE ${startDate ? Prisma.sql`created_at >= ${startDate}` : Prisma.sql`1=1`}
    ${endDate ? Prisma.sql`AND created_at <= ${endDate}` : Prisma.empty}
    ${
      userId
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM canvassing_visit_users cvu
            WHERE cvu.visit_id = canvassing_visits.id
            AND cvu.user_id = ${parseInt(userId, 10)}
          )`
        : Prisma.empty
    }
    GROUP BY EXTRACT(HOUR FROM created_at), response_received
  `;

  const hourResponses: Record<
    number,
    { positive: number; negative: number; no_response: number; pending: number }
  > = {};

  for (let hour = 0; hour < 24; hour++) {
    hourResponses[hour] = { positive: 0, negative: 0, no_response: 0, pending: 0 };
  }

  for (const row of rows) {
    const hour = Number(row.hour);
    const count = Number(row.count);
    const key = normalizeResponseKey(row.response_received as ResponseType | null);
    hourResponses[hour][key === 'no_response' ? 'no_response' : key] += count;
  }

  return hourResponses;
}
