import { Prisma, ResponseType } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import {
  locationKey,
  resolveVisitLocation,
} from '@/lib/utils/canvassingGeoHelpers';

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

export interface RevisitEfficiency {
  totalRevisits: number;
  revisitSuccessRate: number;
  revisitNoResponseRate: number;
  revisitNegativeRate: number;
  revisitsByResponseType: RevisitsAggregate['revisitsByResponseType'];
}

export interface GeographicCoverage {
  hasData: boolean;
  cityCount: number;
  totalVisitsMapped: number;
  unmappedVisits: number;
  topTwoCitiesShare: number;
  topCities: Array<{ city: string; country: string; totalVisits: number; share: number }>;
  concentrationLevel: 'high' | 'medium' | 'low';
}

export interface MemberActivityRow {
  userId: string;
  daysWithVisits: number;
  daysWithRevisits: number;
  daysWithActivity: number;
  /** Alias mobile Individual Performance */
  activeDays: number;
  calendarDaysInPeriod: number;
  streakDays: number;
  activityRate: number;
}

export interface TeamBenchmarks {
  /** Moyennes calculées sur les membres avec ≥ 1 visite sur la période */
  avgVisitsPerActiveMember: number;
  avgConversionRate: number;
  avgFieldWindowHours: number;
  avgCompletedInventories: number;
  avgPerformanceScore: number;
  avgTotalItems: number;
  avgActiveDays: number;
  totalMembers: number;
  membersWithVisits: number;
  /** Alias rétrocompatibilité mobile */
  avgVisitsPerMember: number;
}

export interface VsTeamAverageComparison {
  team: {
    totalVisits: number;
    responseRate: number;
    completedInventories: number;
    fieldWindowHours: number;
    performanceScore: number;
    totalItems: number;
    activeDays: number;
  };
  delta: {
    totalVisits: number;
    responseRate: number;
    completedInventories: number;
    fieldWindowHours: number;
    performanceScore: number;
    totalItems: number;
    activeDays: number;
  };
  /** Alias plats rétrocompatibilité */
  visitsDelta: number;
  conversionDelta: number;
  fieldHoursDelta: number;
  completedInventoriesDelta: number;
  performanceScoreDelta: number;
  activeDaysDelta: number;
}

export interface MemberToFollowUp {
  userId: string;
  name: string;
  reasons: Array<'zero_visits_in_period' | 'below_team_avg_visits'>;
  daysSinceLastActivity: number | null;
  totalVisitsInPeriod: number;
  teamAvgVisitsInPeriod: number;
  visitsVsTeamAverage: number;
  priority: 'high' | 'medium';
}

export interface MembersToFollowUpSummary {
  hasData: boolean;
  count: number;
  teamAvgVisitsInPeriod: number;
  members: MemberToFollowUp[];
}

export interface TodayPulse {
  onlineUsers: number;
  todayVisits: number;
  todayItems: number;
  activeUserIds: string[];
  membersWithPinToday: number;
  totalActiveMembers: number;
  membersWithPinTodayRatio: string;
  periodDailyAverageVisits: number;
  todayVisitsVsPeriodAverage: number;
}

export interface DormantMembersSummary {
  hasData: boolean;
  count: number;
  teamAvgVisitsInPeriod: number;
  zeroVisitsInPeriod: Array<{ userId: string; name: string }>;
  belowTeamAverage: Array<{
    userId: string;
    name: string;
    totalVisitsInPeriod: number;
    teamAvgVisitsInPeriod: number;
    visitsVsTeamAverage: number;
  }>;
  /** Informatif uniquement — ne déclenche plus de relance si pins ≥ moyenne équipe */
  inactiveOver7Days: Array<{ userId: string; name: string; daysSinceLastActivity: number | null }>;
}

export interface TrendsAggregate {
  visitsTrend: number;
  itemsTrend: number;
  performanceTrend: number;
  locationsTrend: number;
  categoriesTrend: number;
  /** Taux conversion positive/drops (%) vs période précédente */
  conversionTrend: number;
  /** Visites par membre actif vs période précédente */
  productivityTrend: number;
  /** Visites / membres ayant posé ≥ 1 pin sur la période */
  currentProductivity: number;
  previousProductivity: number;
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

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Lundi 00:00 de la semaine calendaire contenant `date` (ISO : semaine lun→dim) */
function getMondayOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const weekday = d.getDay(); // 0 = dimanche
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

/** Dimanche 23:59:59.999 de la semaine calendaire contenant `date` */
function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return endOfDay(sunday);
}

export interface ResolvedStatsDateRanges {
  current: DateRange;
  previous: DateRange | null;
}

export function isAllTimePeriod(period: string): boolean {
  return period === 'all';
}

export function emptyTrendsAggregate(): TrendsAggregate {
  return {
    visitsTrend: 0,
    itemsTrend: 0,
    performanceTrend: 0,
    locationsTrend: 0,
    categoriesTrend: 0,
    conversionTrend: 0,
    productivityTrend: 0,
    currentProductivity: 0,
    previousProductivity: 0,
  };
}

async function getEarliestActivityDate(userId?: string | null): Promise<Date> {
  const parsedUserId = userId ? parseInt(userId, 10) : null;

  const [visit, revisit, property, image] = await Promise.all([
    prisma.canvassingVisit.findFirst({
      where: parsedUserId
        ? { visitUsers: { some: { userId: parsedUserId } } }
        : undefined,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.revisit.findFirst({
      where: parsedUserId ? { userId: parsedUserId } : undefined,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.property.findFirst({
      where: parsedUserId ? { userId: parsedUserId } : undefined,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.roomImage.findFirst({
      where: parsedUserId
        ? { room: { property: { userId: parsedUserId } } }
        : undefined,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  const timestamps = [visit, revisit, property, image]
    .map((row) => row?.createdAt?.getTime())
    .filter((value): value is number => value !== undefined);

  if (timestamps.length === 0) {
    return startOfDay(new Date());
  }

  return startOfDay(new Date(Math.min(...timestamps)));
}

/**
 * Résout la fenêtre courante et la fenêtre de comparaison.
 * `period=all` → toutes les données depuis la 1re activité ; pas de période précédente.
 */
export async function resolveStatsDateRanges(
  period: string,
  now: Date,
  userId?: string | null
): Promise<ResolvedStatsDateRanges> {
  if (isAllTimePeriod(period)) {
    return {
      current: {
        start: await getEarliestActivityDate(userId),
        end: endOfDay(now),
      },
      previous: null,
    };
  }

  return {
    current: getDateRangeByPeriod(period, now),
    previous: getPreviousDateRange(period, now),
  };
}

/**
 * Période courante (calendaire).
 * - all : depuis la 1re activité en base → aujourd'hui (voir resolveStatsDateRanges)
 * - today : jour en cours
 * - week : lundi→dimanche de la semaine courante
 * - month : 1er du mois courant → aujourd'hui
 * - last3months : 3 mois complets avant le mois courant (ex. en juin → mars–mai)
 * - quarter : trimestre calendaire courant → aujourd'hui
 * - year : 1er janvier → aujourd'hui
 */
export function getDateRangeByPeriod(period: string, now: Date): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'all':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: getMondayOfWeek(now), end: getSundayOfWeek(now) };
    case 'month':
      return {
        start: startOfDay(new Date(year, month, 1)),
        end: endOfDay(now),
      };
    case 'last3months':
      return {
        start: startOfDay(new Date(year, month - 3, 1)),
        end: endOfDay(new Date(year, month, 0)),
      };
    case 'quarter': {
      const quarterIndex = Math.floor(month / 3);
      return {
        start: startOfDay(new Date(year, quarterIndex * 3, 1)),
        end: endOfDay(now),
      };
    }
    case 'year':
      return {
        start: startOfDay(new Date(year, 0, 1)),
        end: endOfDay(now),
      };
    default:
      return {
        start: startOfDay(new Date(year, month, 1)),
        end: endOfDay(now),
      };
  }
}

/**
 * Période de comparaison (N−1 calendaire).
 * - today → hier
 * - week → semaine précédente (lun→dim)
 * - month → mois précédent complet
 * - last3months → 3 mois précédant la fenêtre courante (ex. mar–mai vs déc–fév)
 * - quarter → trimestre précédent
 * - year → année précédente complète
 */
export function getPreviousDateRange(period: string, now: Date): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'all':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'today': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case 'week': {
      const thisMonday = getMondayOfWeek(now);
      const previousSunday = endOfDay(new Date(thisMonday.getTime() - 24 * 60 * 60 * 1000));
      return {
        start: getMondayOfWeek(previousSunday),
        end: getSundayOfWeek(previousSunday),
      };
    }
    case 'month':
      return {
        start: startOfDay(new Date(year, month - 1, 1)),
        end: endOfDay(new Date(year, month, 0)),
      };
    case 'last3months':
      return {
        start: startOfDay(new Date(year, month - 6, 1)),
        end: endOfDay(new Date(year, month - 3, 0)),
      };
    case 'quarter': {
      const quarterIndex = Math.floor(month / 3);
      if (quarterIndex === 0) {
        return {
          start: startOfDay(new Date(year - 1, 9, 1)),
          end: endOfDay(new Date(year - 1, 11, 31)),
        };
      }
      const prevQuarterIndex = quarterIndex - 1;
      return {
        start: startOfDay(new Date(year, prevQuarterIndex * 3, 1)),
        end: endOfDay(new Date(year, prevQuarterIndex * 3 + 3, 0)),
      };
    }
    case 'year':
      return {
        start: startOfDay(new Date(year - 1, 0, 1)),
        end: endOfDay(new Date(year - 1, 11, 31)),
      };
    default:
      return {
        start: startOfDay(new Date(year, month - 1, 1)),
        end: endOfDay(new Date(year, month, 0)),
      };
  }
}

export function getStartDateByPeriod(period: string, now: Date): Date {
  return getDateRangeByPeriod(period, now).start;
}

export function getEndDateByPeriod(period: string, now: Date): Date {
  return getDateRangeByPeriod(period, now).end;
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

async function calcConversionRate(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  return calcPerformanceRate(startDate, endDate, userId);
}

async function countActiveMembersInPeriod(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  if (userId) return 1;

  const rows = await prisma.canvassingVisitUser.findMany({
    where: {
      visit: {
        createdAt: buildDateFilter(startDate, endDate),
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  return rows.length;
}

async function calcProductivity(
  startDate: Date,
  endDate: Date | undefined,
  userId?: string | null
): Promise<number> {
  const [visits, activeMembers] = await Promise.all([
    countVisitsInRange(startDate, endDate, userId),
    countActiveMembersInPeriod(startDate, endDate, userId),
  ]);

  if (activeMembers === 0) return 0;
  return round1(visits / activeMembers);
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
    currentConversion,
    previousConversion,
    currentProductivity,
    previousProductivity,
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
    calcConversionRate(current.start, current.end, userId),
    calcConversionRate(previous.start, previous.end, userId),
    calcProductivity(current.start, current.end, userId),
    calcProductivity(previous.start, previous.end, userId),
  ]);

  return {
    visitsTrend: calcTrendPercent(currentVisits, previousVisits),
    itemsTrend: calcTrendPercent(currentItems, previousItems),
    performanceTrend: calcTrendPercent(currentPerformance, previousPerformance),
    locationsTrend: calcTrendPercent(currentLocations, previousLocations),
    categoriesTrend: calcTrendPercent(currentCategories, previousCategories),
    conversionTrend: calcTrendPercent(currentConversion, previousConversion),
    productivityTrend: calcTrendPercent(currentProductivity, previousProductivity),
    currentProductivity,
    previousProductivity,
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
      ...(userFilter && { visitUsers: { some: { userId: userFilter } } }),
    },
    select: {
      latitude: true,
      longitude: true,
      city: true,
      streetAddress: true,
      neighborhood: true,
      responseReceived: true,
    },
  });

  const revisits = await prisma.revisit.findMany({
    where: {
      createdAt: dateFilter,
      ...(userFilter && { userId: userFilter }),
    },
    select: {
      latitude: true,
      longitude: true,
      city: true,
      streetAddress: true,
      neighborhood: true,
      responseReceived: true,
    },
  });

  type CityBucket = {
    city: string;
    country: string;
    totalVisits: number;
    positive: number;
    negative: number;
    noResponse: number;
    pending: number;
    totalRevisits: number;
  };

  const buckets = new Map<string, CityBucket>();

  const ensure = (location: { city: string; country: string }): CityBucket => {
    const key = locationKey({ city: location.city, country: location.country, source: 'city' });
    if (!buckets.has(key)) {
      buckets.set(key, {
        city: location.city,
        country: location.country,
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
    const location = resolveVisitLocation(visit) ?? {
      city: 'Unknown',
      country: '',
      source: 'country_only' as const,
    };

    const bucket = ensure(location);
    bucket.totalVisits++;
    if (visit.responseReceived === ResponseType.positive) bucket.positive++;
    else if (visit.responseReceived === ResponseType.negative) bucket.negative++;
    else if (visit.responseReceived === ResponseType.pending) bucket.pending++;
    else bucket.noResponse++;
  }

  for (const revisit of revisits) {
    const location = resolveVisitLocation(revisit) ?? {
      city: 'Unknown',
      country: '',
      source: 'country_only' as const,
    };

    const bucket = ensure(location);
    bucket.totalRevisits++;
  }

  return Array.from(buckets.values())
    .filter((stats) => stats.totalVisits > 0 || stats.totalRevisits > 0)
    .map((stats) => {
      const responded = stats.positive + stats.negative;
      return {
        city: stats.city,
        country: stats.country,
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

export function buildRevisitEfficiency(
  revisits: RevisitsAggregate
): RevisitEfficiency {
  const { totalRevisits, revisitsByResponseType: r } = revisits;

  return {
    totalRevisits,
    revisitSuccessRate:
      totalRevisits > 0 ? round1((r.positive / totalRevisits) * 100) : 0,
    revisitNoResponseRate:
      totalRevisits > 0 ? round1((r.no_response / totalRevisits) * 100) : 0,
    revisitNegativeRate:
      totalRevisits > 0 ? round1((r.negative / totalRevisits) * 100) : 0,
    revisitsByResponseType: r,
  };
}

export function buildGeographicCoverage(
  cityStats: Awaited<ReturnType<typeof getCityStatsAggregate>>,
  totalDrops: number
): GeographicCoverage {
  const sorted = [...cityStats].sort((a, b) => b.totalVisits - a.totalVisits);
  const totalVisitsMapped = sorted.reduce((sum, row) => sum + row.totalVisits, 0);
  const topTwoVisits = sorted
    .slice(0, 2)
    .reduce((sum, row) => sum + row.totalVisits, 0);
  const denominator = totalDrops > 0 ? totalDrops : totalVisitsMapped;
  const topTwoCitiesShare =
    denominator > 0 ? round1((topTwoVisits / denominator) * 100) : 0;

  let concentrationLevel: GeographicCoverage['concentrationLevel'] = 'low';
  if (topTwoCitiesShare >= 80) concentrationLevel = 'high';
  else if (topTwoCitiesShare >= 50) concentrationLevel = 'medium';

  return {
    hasData: denominator > 0,
    cityCount: sorted.length,
    totalVisitsMapped,
    unmappedVisits: Math.max(0, denominator - totalVisitsMapped),
    topTwoCitiesShare,
    topCities: sorted.slice(0, 5).map((row) => ({
      city: row.city,
      country: row.country,
      totalVisits: row.totalVisits,
      share: denominator > 0 ? round1((row.totalVisits / denominator) * 100) : 0,
    })),
    concentrationLevel,
  };
}

function calendarDaysInPeriod(startDate: Date, endDate: Date): number {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

function longestDayStreak(sortedDayKeys: string[]): number {
  if (sortedDayKeys.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDayKeys.length; i++) {
    const prev = new Date(`${sortedDayKeys[i - 1]}T00:00:00.000Z`);
    const curr = new Date(`${sortedDayKeys[i]}T00:00:00.000Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

export async function getMemberActivityStats(
  startDate: Date,
  endDate: Date,
  userId?: string | null
): Promise<MemberActivityRow[]> {
  const userFilter = userId ? parseInt(userId, 10) : null;
  const calendarDays = calendarDaysInPeriod(startDate, endDate);

  const users = await prisma.user.findMany({
    where: userFilter ? { id: userFilter, isActive: true } : { isActive: true },
    select: { id: true },
  });

  const visitRows = await prisma.canvassingVisit.findMany({
    where: {
      createdAt: buildDateFilter(startDate, endDate),
      ...(userFilter && { visitUsers: { some: { userId: userFilter } } }),
    },
    select: {
      createdAt: true,
      visitUsers: { select: { userId: true } },
    },
  });

  const revisitRows = await prisma.revisit.findMany({
    where: {
      createdAt: buildDateFilter(startDate, endDate),
      ...(userFilter && { userId: userFilter }),
    },
    select: {
      createdAt: true,
      userId: true,
    },
  });

  const visitDaysByUser = new Map<number, Set<string>>();
  const revisitDaysByUser = new Map<number, Set<string>>();

  for (const visit of visitRows) {
    const day = visit.createdAt.toISOString().slice(0, 10);
    for (const vu of visit.visitUsers) {
      if (userFilter && vu.userId !== userFilter) continue;
      if (!visitDaysByUser.has(vu.userId)) visitDaysByUser.set(vu.userId, new Set());
      visitDaysByUser.get(vu.userId)!.add(day);
    }
  }

  for (const revisit of revisitRows) {
    const day = revisit.createdAt.toISOString().slice(0, 10);
    if (!revisitDaysByUser.has(revisit.userId)) revisitDaysByUser.set(revisit.userId, new Set());
    revisitDaysByUser.get(revisit.userId)!.add(day);
  }

  return users.map((user) => {
    const visitDays = visitDaysByUser.get(user.id) ?? new Set<string>();
    const revisitDays = revisitDaysByUser.get(user.id) ?? new Set<string>();
    const activityDays = new Set([...visitDays, ...revisitDays]);
    const sortedDays = [...activityDays].sort();

    return {
      userId: user.id.toString(),
      daysWithVisits: visitDays.size,
      daysWithRevisits: revisitDays.size,
      daysWithActivity: activityDays.size,
      activeDays: activityDays.size,
      calendarDaysInPeriod: calendarDays,
      streakDays: longestDayStreak(sortedDays),
      activityRate:
        calendarDays > 0 ? round1((activityDays.size / calendarDays) * 100) : 0,
    };
  });
}

export function formatLastActivityLabel(daysSinceLastActivity: number | null): string {
  if (daysSinceLastActivity === null) return 'Never active';
  if (daysSinceLastActivity === 0) return 'Today';
  if (daysSinceLastActivity === 1) return '1 day ago';
  return `${daysSinceLastActivity} days ago`;
}

export async function getLastFieldActivityByUserIds(
  userIds: number[]
): Promise<Map<number, Date>> {
  if (userIds.length === 0) return new Map();

  const [activityRows, visitRows, revisitRows] = await Promise.all([
    prisma.userActivity.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { timestamp: true },
    }),
    prisma.$queryRaw<Array<{ user_id: number; last_at: Date }>>`
      SELECT
        cvu.user_id,
        MAX(GREATEST(cvu.joined_at, cv.created_at)) AS last_at
      FROM canvassing_visit_users cvu
      INNER JOIN canvassing_visits cv ON cv.id = cvu.visit_id
      WHERE cvu.user_id IN (${Prisma.join(userIds)})
      GROUP BY cvu.user_id
    `,
    prisma.revisit.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { createdAt: true },
    }),
  ]);

  const result = new Map<number, Date>();

  for (const userId of userIds) {
    const candidates: Date[] = [];

    const activity = activityRows.find((row) => row.userId === userId)?._max.timestamp;
    if (activity) candidates.push(activity);

    const visit = visitRows.find((row) => Number(row.user_id) === userId)?.last_at;
    if (visit) candidates.push(new Date(visit));

    const revisit = revisitRows.find((row) => row.userId === userId)?._max.createdAt;
    if (revisit) candidates.push(revisit);

    if (candidates.length > 0) {
      result.set(userId, new Date(Math.max(...candidates.map((date) => date.getTime()))));
    }
  }

  return result;
}

export function buildTeamBenchmarks(
  users: Array<{
    id: string;
    performance: {
      totalVisits: number;
      totalItems: number;
      responseRate: number;
      performanceScore: number;
      completedInventories: number;
      fieldTime?: { fieldWindowHours: number } | null;
    };
  }>,
  memberActivityStats: MemberActivityRow[] = []
): TeamBenchmarks {
  const totalMembers = users.length;
  const activeUsers = users.filter((u) => u.performance.totalVisits > 0);
  const membersWithVisits = activeUsers.length;
  const activityByUserId = new Map(memberActivityStats.map((row) => [row.userId, row]));

  const emptyBenchmarks: TeamBenchmarks = {
    avgVisitsPerActiveMember: 0,
    avgVisitsPerMember: 0,
    avgConversionRate: 0,
    avgFieldWindowHours: 0,
    avgCompletedInventories: 0,
    avgPerformanceScore: 0,
    avgTotalItems: 0,
    avgActiveDays: 0,
    totalMembers,
    membersWithVisits: 0,
  };

  if (activeUsers.length === 0) {
    return emptyBenchmarks;
  }

  const sumVisits = activeUsers.reduce((sum, user) => sum + user.performance.totalVisits, 0);
  const sumConversion = activeUsers.reduce((sum, user) => sum + user.performance.responseRate, 0);
  const sumFieldHours = activeUsers.reduce(
    (sum, user) => sum + (user.performance.fieldTime?.fieldWindowHours ?? 0),
    0
  );
  const sumInventories = activeUsers.reduce(
    (sum, user) => sum + user.performance.completedInventories,
    0
  );
  const sumPerformanceScore = activeUsers.reduce(
    (sum, user) => sum + user.performance.performanceScore,
    0
  );
  const sumItems = activeUsers.reduce((sum, user) => sum + user.performance.totalItems, 0);
  const sumActiveDays = activeUsers.reduce(
    (sum, user) => sum + (activityByUserId.get(user.id)?.daysWithActivity ?? 0),
    0
  );
  const activeCount = activeUsers.length;

  const avgVisitsPerActiveMember = round1(sumVisits / activeCount);

  return {
    avgVisitsPerActiveMember,
    avgVisitsPerMember: avgVisitsPerActiveMember,
    avgConversionRate: round1(sumConversion / activeCount),
    avgFieldWindowHours: round1(sumFieldHours / activeCount),
    avgCompletedInventories: round1(sumInventories / activeCount),
    avgPerformanceScore: round1(sumPerformanceScore / activeCount),
    avgTotalItems: round1(sumItems / activeCount),
    avgActiveDays: round1(sumActiveDays / activeCount),
    totalMembers,
    membersWithVisits,
  };
}

export function shouldFollowUpMember(
  totalVisitsInPeriod: number,
  teamAvgVisitsInPeriod: number
): boolean {
  return totalVisitsInPeriod === 0 || totalVisitsInPeriod < teamAvgVisitsInPeriod;
}

export function buildFollowUpReasons(
  totalVisitsInPeriod: number,
  teamAvgVisitsInPeriod: number
): MemberToFollowUp['reasons'] {
  const reasons: MemberToFollowUp['reasons'] = [];
  if (totalVisitsInPeriod === 0) {
    reasons.push('zero_visits_in_period');
  } else if (totalVisitsInPeriod < teamAvgVisitsInPeriod) {
    reasons.push('below_team_avg_visits');
  }
  return reasons;
}

export function buildDormantMembersSummary(
  users: Array<{
    id: string;
    name: string;
    performance: {
      totalVisits: number;
      daysSinceLastActivity: number | null;
      zeroVisitsInPeriod?: boolean;
      isDormant?: boolean;
    };
  }>,
  benchmarks: TeamBenchmarks
): DormantMembersSummary {
  const teamAvgVisitsInPeriod = benchmarks.avgVisitsPerActiveMember;

  const zeroVisitsInPeriod = users
    .filter((user) => user.performance.zeroVisitsInPeriod ?? user.performance.totalVisits === 0)
    .map((user) => ({ userId: user.id, name: user.name }));

  const belowTeamAverage = users
    .filter(
      (user) =>
        user.performance.totalVisits > 0 &&
        user.performance.totalVisits < teamAvgVisitsInPeriod
    )
    .map((user) => ({
      userId: user.id,
      name: user.name,
      totalVisitsInPeriod: user.performance.totalVisits,
      teamAvgVisitsInPeriod,
      visitsVsTeamAverage: round1(user.performance.totalVisits - teamAvgVisitsInPeriod),
    }));

  const inactiveOver7Days = users
    .filter((user) => user.performance.isDormant ?? false)
    .map((user) => ({
      userId: user.id,
      name: user.name,
      daysSinceLastActivity: user.performance.daysSinceLastActivity,
    }));

  const followUpIds = new Set([
    ...zeroVisitsInPeriod.map((member) => member.userId),
    ...belowTeamAverage.map((member) => member.userId),
  ]);

  return {
    hasData: followUpIds.size > 0,
    count: followUpIds.size,
    teamAvgVisitsInPeriod,
    zeroVisitsInPeriod,
    belowTeamAverage,
    inactiveOver7Days,
  };
}

export function buildMembersToFollowUp(
  users: Array<{
    id: string;
    name: string;
    performance: {
      totalVisits: number;
      daysSinceLastActivity: number | null;
    };
  }>,
  benchmarks: TeamBenchmarks
): MembersToFollowUpSummary {
  const teamAvgVisitsInPeriod = benchmarks.avgVisitsPerActiveMember;

  const members = users
    .filter((user) =>
      shouldFollowUpMember(user.performance.totalVisits, teamAvgVisitsInPeriod)
    )
    .map((user) => {
      const totalVisitsInPeriod = user.performance.totalVisits;
      const reasons = buildFollowUpReasons(totalVisitsInPeriod, teamAvgVisitsInPeriod);
      const visitsVsTeamAverage = round1(totalVisitsInPeriod - teamAvgVisitsInPeriod);

      return {
        userId: user.id,
        name: user.name,
        reasons,
        daysSinceLastActivity: user.performance.daysSinceLastActivity,
        totalVisitsInPeriod,
        teamAvgVisitsInPeriod,
        visitsVsTeamAverage,
        priority: totalVisitsInPeriod === 0 ? ('high' as const) : ('medium' as const),
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.visitsVsTeamAverage - b.visitsVsTeamAverage;
    });

  return {
    hasData: members.length > 0,
    count: members.length,
    teamAvgVisitsInPeriod,
    members,
  };
}

function buildVsTeamAverageComparison(
  performance: {
    totalVisits: number;
    totalItems: number;
    responseRate: number;
    performanceScore: number;
    completedInventories: number;
    activeDays?: number;
    fieldTime?: { fieldWindowHours: number } | null;
  },
  benchmarks: TeamBenchmarks
): VsTeamAverageComparison {
  const team = {
    totalVisits: benchmarks.avgVisitsPerActiveMember,
    responseRate: benchmarks.avgConversionRate,
    completedInventories: benchmarks.avgCompletedInventories,
    fieldWindowHours: benchmarks.avgFieldWindowHours,
    performanceScore: benchmarks.avgPerformanceScore,
    totalItems: benchmarks.avgTotalItems,
    activeDays: benchmarks.avgActiveDays,
  };

  const delta = {
    totalVisits: round1(performance.totalVisits - team.totalVisits),
    responseRate: round1(performance.responseRate - team.responseRate),
    completedInventories: round1(performance.completedInventories - team.completedInventories),
    fieldWindowHours: round1(
      (performance.fieldTime?.fieldWindowHours ?? 0) - team.fieldWindowHours
    ),
    performanceScore: round1(performance.performanceScore - team.performanceScore),
    totalItems: round1(performance.totalItems - team.totalItems),
    activeDays: round1((performance.activeDays ?? 0) - team.activeDays),
  };

  return {
    team,
    delta,
    visitsDelta: delta.totalVisits,
    conversionDelta: delta.responseRate,
    fieldHoursDelta: delta.fieldWindowHours,
    completedInventoriesDelta: delta.completedInventories,
    performanceScoreDelta: delta.performanceScore,
    activeDaysDelta: delta.activeDays,
  };
}

export function enrichUsersWithTeamComparison<
  T extends {
    id: string;
    performance: {
      totalVisits: number;
      totalItems: number;
      responseRate: number;
      performanceScore: number;
      completedInventories: number;
      daysSinceLastActivity: number | null;
      zeroVisitsInPeriod?: boolean;
      isDormant?: boolean;
      fieldTime?: { fieldWindowHours: number } | null;
    };
  },
>(
  users: T[],
  benchmarks: TeamBenchmarks,
  memberActivityStats: MemberActivityRow[] = []
): Array<
  T & {
    performance: T['performance'] & {
      activeDays: number;
      daysWithVisits: number;
      daysWithRevisits: number;
      streakDays: number;
      activityRate: number;
      calendarDaysInPeriod: number;
      lastActivityLabel: string;
      needsFollowUp: boolean;
    };
    vsTeamAverage: VsTeamAverageComparison;
  }
> {
  const activityByUserId = new Map(memberActivityStats.map((row) => [row.userId, row]));

  return users.map((user) => {
    const activity = activityByUserId.get(user.id);
    const activeDays = activity?.daysWithActivity ?? 0;
    const teamAvgVisits = benchmarks.avgVisitsPerActiveMember;
    const needsFollowUp = shouldFollowUpMember(user.performance.totalVisits, teamAvgVisits);

    const enrichedPerformance = {
      ...user.performance,
      activeDays,
      daysWithVisits: activity?.daysWithVisits ?? 0,
      daysWithRevisits: activity?.daysWithRevisits ?? 0,
      streakDays: activity?.streakDays ?? 0,
      activityRate: activity?.activityRate ?? 0,
      calendarDaysInPeriod: activity?.calendarDaysInPeriod ?? 0,
      lastActivityLabel: formatLastActivityLabel(user.performance.daysSinceLastActivity),
      needsFollowUp,
    };

    return {
      ...user,
      performance: enrichedPerformance,
      vsTeamAverage: buildVsTeamAverageComparison(enrichedPerformance, benchmarks),
    };
  });
}

export async function buildTodayPulse(
  dailyMetrics: Array<{ visits: number }>,
  totalActiveMembers: number
): Promise<TodayPulse> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayVisits, todayItems, todayPinUsers] = await Promise.all([
    prisma.canvassingVisit.count({ where: { createdAt: { gte: today } } }),
    prisma.roomImage.count({ where: { createdAt: { gte: today } } }),
    prisma.canvassingVisitUser.findMany({
      where: { visit: { createdAt: { gte: today } } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  const onlineUsers = await prisma.userActivity.findMany({
    where: { timestamp: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    select: { userId: true },
    distinct: ['userId'],
  });

  const periodDays = Math.max(dailyMetrics.length, 1);
  const totalPeriodVisits = dailyMetrics.reduce((sum, day) => sum + day.visits, 0);
  const periodDailyAverageVisits = round1(totalPeriodVisits / periodDays);
  const membersWithPinToday = todayPinUsers.length;

  return {
    onlineUsers: onlineUsers.length,
    todayVisits,
    todayItems,
    activeUserIds: todayPinUsers.map((row) => row.userId.toString()),
    membersWithPinToday,
    totalActiveMembers,
    membersWithPinTodayRatio: `${membersWithPinToday}/${totalActiveMembers}`,
    periodDailyAverageVisits,
    todayVisitsVsPeriodAverage:
      periodDailyAverageVisits > 0
        ? round1(
            ((todayVisits - periodDailyAverageVisits) / periodDailyAverageVisits) * 100
          )
        : 0,
  };
}
