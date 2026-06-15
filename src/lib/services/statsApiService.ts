// src/lib/services/statsApiService.ts
import { Prisma, ActivityType, ResponseType } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import {
  buildDormantMembersSummary,
  buildGeographicCoverage,
  buildMembersToFollowUp,
  buildRevisitEfficiency,
  buildTeamBenchmarks,
  buildTodayPulse,
  calculateFieldTimeMetrics,
  calculateTrendsForPeriods,
  enrichUsersWithTeamComparison,
  enrichVisitHoursWithResponses,
  getCityStatsAggregate,
  getLastFieldActivityByUserIds,
  getMemberActivityStats,
  getRevisitsAggregate,
  emptyTrendsAggregate,
  resolveStatsDateRanges,
} from '@/lib/services/teamStatsService';
import { resolveVisitLocation } from '@/lib/utils/canvassingGeoHelpers';

export interface StatsApiSuccessResponse {
  success: true;
  data: Record<string, unknown>;
}

export interface StatsApiErrorResponse {
  success: false;
  error: string;
}

export type StatsApiResponse = StatsApiSuccessResponse | StatsApiErrorResponse;

/**
 * Payload Team Performance / dashboard stats (mobile JWT ou admin Maildrop).
 * @param period today | week | month | last3months | quarter | year | all
 * @param userId ID Maildrop numérique ; absent/null = toute l'équipe active
 */
export async function getStatsPayload(
  period: string,
  userId?: string | null
): Promise<StatsApiSuccessResponse> {
  const now = new Date();
  const { current: currentRange, previous: previousDateRange } =
    await resolveStatsDateRanges(period, now, userId);
  const startDate = currentRange.start;
  const endDate = currentRange.end;

  const [
    usersData,
    teamStats,
    userActivities,
    canvassingVisits,
    canvassingStats,
    responseDistribution,
    contactMethodStats,
    visitHours,
    inventoryStats,
    inventoryActivity,
    syncStatus,
    dailyMetrics,
    recentActivities,
    systemMetrics,
    revisitsAggregate,
    trends,
    cityStats,
    visitHourResponses,
    memberActivityStats,
  ] = await Promise.all([
    getUsersWithPerformance(userId, startDate, endDate),
    getTeamStats(startDate, endDate),
    getUserActivitiesSummary(userId, startDate, endDate),
    getCanvassingVisits(userId, startDate, endDate),
    getCanvassingStatistics(userId, startDate, endDate),
    getResponseTypeDistribution(userId, startDate, endDate),
    getContactMethodPerformance(userId, startDate, endDate),
    getVisitHourDistribution(userId, startDate, endDate),
    getInventoryStatistics(userId, startDate, endDate),
    getInventoryActivity(userId, startDate, endDate),
    getSyncStatusData(),
    getDailyMetrics(startDate, endDate, userId),
    getRecentActivities(20),
    getSystemMetricsData(startDate, endDate),
    getRevisitsAggregate(startDate, endDate, userId),
    previousDateRange
      ? calculateTrendsForPeriods(currentRange, previousDateRange, userId)
      : Promise.resolve(emptyTrendsAggregate()),
    getCityStatsAggregate(startDate, endDate, userId),
    enrichVisitHoursWithResponses(userId, startDate, endDate),
    getMemberActivityStats(startDate, endDate, userId),
  ]);

  const teamBenchmarks = buildTeamBenchmarks(usersData, memberActivityStats);
  const usersWithComparison = enrichUsersWithTeamComparison(
    usersData,
    teamBenchmarks,
    memberActivityStats
  );
  const dormantMembers = buildDormantMembersSummary(usersWithComparison, teamBenchmarks);
  const membersToFollowUp = buildMembersToFollowUp(usersWithComparison, teamBenchmarks);
  const revisitEfficiency = buildRevisitEfficiency(revisitsAggregate);
  const geographicCoverage = buildGeographicCoverage(
    cityStats,
    canvassingStats.totalDrops
  );
  const todayPulse = await buildTodayPulse(dailyMetrics, teamStats.activeMembers);

  const maildropStats = {
    ...canvassingStats,
    totalRevisits: revisitsAggregate.totalRevisits,
    revisitsByResponseType: revisitsAggregate.revisitsByResponseType,
    responseRate: round1(canvassingStats.responseRate),
  };

  const visitHoursEnriched = visitHours.map((row) => ({
    ...row,
    responses: visitHourResponses[row.hour] ?? {
      positive: 0,
      negative: 0,
      no_response: 0,
      pending: 0,
    },
  }));

  return {
    success: true,
    data: {
      metadata: {
        period,
        userId: userId || 'all',
        generatedAt: now.toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        previousDateRange: previousDateRange
          ? {
              start: previousDateRange.start.toISOString(),
              end: previousDateRange.end.toISOString(),
            }
          : null,
      },
      team: {
        users: usersWithComparison,
        stats: teamStats,
        activities: userActivities,
        benchmarks: teamBenchmarks,
        dormantMembers,
        membersToFollowUp,
        memberActivity: memberActivityStats,
        activityRegularity: {
          hasData: memberActivityStats.length > 0,
          members: memberActivityStats,
        },
      },
      maildrop: {
        visits: formatCanvassingVisitsForMobile(canvassingVisits),
        stats: maildropStats,
        responses: responseDistribution,
        contactMethods: contactMethodStats,
        visitHours: visitHoursEnriched,
        cityStats,
        revisitEfficiency,
        geographicCoverage,
      },
      inventory: {
        stats: inventoryStats,
        activity: inventoryActivity,
        sync: syncStatus,
      },
      temporal: {
        daily: dailyMetrics,
        trends,
      },
      realTime: {
        activities: recentActivities,
        pulse: todayPulse,
        onlineUsers: todayPulse.onlineUsers,
        todayStats: todayPulse,
      },
      system: systemMetrics,
    },
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatCanvassingVisitsForMobile(
  visits: Awaited<ReturnType<typeof getCanvassingVisits>>
) {
  return visits.map((visit) => {
    const resolved = resolveVisitLocation({
      latitude: visit.latitude,
      longitude: visit.longitude,
      city: visit.city,
      streetAddress: visit.streetAddress,
      neighborhood: visit.neighborhood,
    });

    return {
      id: visit.id,
      latitude: visit.latitude,
      longitude: visit.longitude,
      contactMethod: visit.contactMethod,
      contactMethod2: visit.contactMethod2,
      contactMethod3: visit.contactMethod3,
      contactMethod4: visit.contactMethod4,
      responseReceived: visit.responseReceived,
      createdAt: visit.createdAt.toISOString(),
      isRevisit: false,
      originalVisitId: null,
      city: resolved?.city ?? visit.city ?? null,
      country: resolved?.country ?? null,
    };
  });
}

async function getUsersWithPerformance(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = userId ? { id: parseInt(userId) } : { isActive: true };
  
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      canvassingVisits: {
        where: startDate ? {
          visit: {
            createdAt: {
              gte: startDate,
              ...(endDate && { lte: endDate }),
            },
          },
        } : undefined,
        select: {
          visit: {
            select: {
              responseReceived: true,
              createdAt: true
            }
          }
        }
      },
      properties: {
        where: startDate ? { 
          createdAt: { 
            gte: startDate,
            ...(endDate && { lte: endDate })
          } 
        } : undefined,
        select: {
          imageCount: true,
          inventoryStatus: true
        }
      }
    }
  });

  const lastActivityByUserId = users.length
    ? await getLastFieldActivityByUserIds(users.map((user) => user.id))
    : new Map<number, Date>();

  const usersWithFieldTime = await Promise.all(
    users.map(async (user) => {
      const totalVisits = user.canvassingVisits.length;
      const positiveResponses = user.canvassingVisits.filter(
        cv => cv.visit.responseReceived === 'positive'
      ).length;
      const totalItems = user.properties.reduce((sum, p) => sum + p.imageCount, 0);
      const completedInventories = user.properties.filter(
        p => p.inventoryStatus === 'COMPLETED' || p.inventoryStatus === 'FINALIZED'
      ).length;

      const fieldTime =
        startDate
          ? await calculateFieldTimeMetrics(user.id, startDate, endDate)
          : null;

      const lastActivityDate = lastActivityByUserId.get(user.id) ?? null;
      const lastActivity = lastActivityDate ? lastActivityDate.getTime() : null;
      const daysSinceLastActivity =
        lastActivityDate !== null && lastActivityDate !== undefined
          ? Math.floor((Date.now() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
          : null;

      return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        performance: {
          totalVisits,
          totalItems,
          positiveResponses,
          completedInventories,
          responseRate: totalVisits > 0 ? round1(positiveResponses / totalVisits * 100) : 0,
          performanceScore: calculatePerformanceScore(totalVisits, positiveResponses, totalItems),
          lastActivity,
          daysSinceLastActivity,
          zeroVisitsInPeriod: totalVisits === 0,
          isDormant: daysSinceLastActivity === null || daysSinceLastActivity > 7,
          ...(fieldTime && {
            fieldTime: {
              totalPins: fieldTime.totalPins,
              totalVisits: fieldTime.totalVisits,
              totalRevisits: fieldTime.totalRevisits,
              activeHoursDistinct: fieldTime.activeHoursDistinct,
              fieldWindowHours: fieldTime.fieldWindowHours,
              fieldWindowMinutes: fieldTime.fieldWindowMinutes,
              estimatedFieldHours: fieldTime.estimatedFieldHours,
              estimatedFieldMinutes: fieldTime.estimatedFieldMinutes,
              averageMinutesPerPin: fieldTime.averageMinutesPerPin,
              estimationMethod: fieldTime.estimationMethod,
            },
          }),
        }
      };
    })
  );

  return usersWithFieldTime;
}

async function getTeamStats(startDate: Date, endDate?: Date) {
  const [totalUsers, activeUsers, newUsers, avgPerformance] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    } }),
    calculateAveragePerformance(startDate, endDate)
  ]);
  
  const roleDistribution = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });

  return {
    totalMembers: totalUsers,
    activeMembers: activeUsers,
    newMembers: newUsers,
    avgPerformance,
    roleDistribution: Object.fromEntries(
      roleDistribution.map(r => [r.role, r._count.id])
    )
  };
}

async function getUserActivitiesSummary(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { 
      timestamp: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    })
  };

  const activities = await prisma.userActivity.groupBy({
    where: whereClause,
    by: ['activityType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  return activities.map(activity => ({
    type: activity.activityType,
    count: activity._count.id
  }));
}

// 2. Fonctions pour les données maildrop
async function getCanvassingVisits(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  return await prisma.canvassingVisit.findMany({
    where: whereClause,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      contactMethod: true,
      contactMethod2: true,
      contactMethod3: true,
      contactMethod4: true,
      responseReceived: true,
      createdAt: true,
      city: true,
      streetAddress: true,
      neighborhood: true,
      visitUsers: {
        select: {
          userName: true,
          user: {
            select: { name: true, id: true }
          }
        }
      },
      revisits: {
        select: {
          id: true,
          createdAt: true,
          responseReceived: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getCanvassingStatistics(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  const [totalVisits, responses] = await Promise.all([
    prisma.canvassingVisit.count({ where: whereClause }),
    prisma.canvassingVisit.groupBy({
      where: whereClause,
      by: ['responseReceived'],
      _count: { id: true }
    })
  ]);

  const responseStats = responses.reduce((acc, r) => {
    acc[r.responseReceived || 'no_response'] = r._count.id;
    return acc;
  }, {} as Record<string, number>);

  const positiveResponses = responseStats.positive || 0;
  const negativeResponses = responseStats.negative || 0;
  const noResponses = responseStats.no_response || 0;
  const pendingResponses = responseStats.pending || 0;

  return {
    totalDrops: totalVisits,
    positiveResponses,
    negativeResponses,
    noResponses,
    pendingResponses,
    responseRate: totalVisits > 0 ? round1((positiveResponses / totalVisits) * 100) : 0
  };
}

async function getResponseTypeDistribution(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  const responses = await prisma.canvassingVisit.groupBy({
    where: whereClause,
    by: ['responseReceived'],
    _count: { id: true }
  });

  return responses.map(r => ({
    type: r.responseReceived || 'no_response',
    count: r._count.id,
    percentage: 0 // Will be calculated in frontend
  }));
}

async function getContactMethodPerformance(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  const visits = await prisma.canvassingVisit.findMany({
    where: whereClause,
    select: {
      contactMethod: true,
      contactMethod2: true,
      contactMethod3: true,
      contactMethod4: true,
      responseReceived: true
    }
  });

  const methodStats = {} as Record<string, { total: number, positive: number }>;

  visits.forEach(visit => {
    [visit.contactMethod, visit.contactMethod2, visit.contactMethod3, visit.contactMethod4]
      .filter(method => method)
      .forEach(method => {
        if (!methodStats[method!]) {
          methodStats[method!] = { total: 0, positive: 0 };
        }
        methodStats[method!].total++;
        if (visit.responseReceived === 'positive') {
          methodStats[method!].positive++;
        }
      });
  });

  return Object.entries(methodStats).map(([method, stats]) => ({
    method,
    totalVisits: stats.total,
    positiveResponses: stats.positive,
    responseRate: stats.total > 0 ? (stats.positive / stats.total * 100) : 0
  }));
}

async function getVisitHourDistribution(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  const visits = await prisma.$queryRaw<Array<{hour: number, count: bigint, visit_type: string}>>`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count,
      'visit' as visit_type
    FROM canvassing_visits 
    WHERE ${startDate ? Prisma.sql`created_at >= ${startDate}` : Prisma.sql`1=1`}
    ${endDate ? Prisma.sql`AND created_at <= ${endDate}` : Prisma.empty}
    ${userId ? Prisma.sql`AND EXISTS (SELECT 1 FROM canvassing_visit_users cvu WHERE cvu.visit_id = canvassing_visits.id AND cvu.user_id = ${parseInt(userId)})` : Prisma.empty}
    GROUP BY EXTRACT(HOUR FROM created_at)
    
    UNION ALL
    
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count,
      'revisit' as visit_type
    FROM revisits 
    WHERE ${startDate ? Prisma.sql`created_at >= ${startDate}` : Prisma.sql`1=1`}
    ${endDate ? Prisma.sql`AND created_at <= ${endDate}` : Prisma.empty}
    ${userId ? Prisma.sql`AND user_id = ${parseInt(userId)}` : Prisma.empty}
    GROUP BY EXTRACT(HOUR FROM created_at)
    
    ORDER BY hour
  `;

  const hourStats = {} as Record<number, { visits: number, revisits: number }>;
  
  // Initialiser toutes les heures à 0
  for (let hour = 0; hour < 24; hour++) {
    hourStats[hour] = { visits: 0, revisits: 0 };
  }

  // Remplir avec les données réelles
  visits.forEach(row => {
    const hour = Number(row.hour);
    const count = Number(row.count);
    if (row.visit_type === 'visit') {
      hourStats[hour].visits = count;
    } else {
      hourStats[hour].revisits = count;
    }
  });

  return Object.entries(hourStats).map(([hour, stats]) => ({
    hour: parseInt(hour),
    totalVisits: stats.visits,
    totalRevisits: stats.revisits,
    total: stats.visits + stats.revisits
  }));
}

// 3. Fonctions pour les données inventory
async function getInventoryStatistics(userId?: string | null, startDate?: Date, endDate?: Date) {
  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    })
  };

  const [totalItems, totalLocations, categoryDistribution] = await Promise.all([
    prisma.roomImage.count({ where: startDate ? { 
      createdAt: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    } : undefined }),
    prisma.property.count({ where: whereClause }),
    getRoomCategoryDistribution(userId, startDate, endDate)
  ]);

  return {
    totalItems,
    totalLocations,
    totalCategories: Object.keys(categoryDistribution).length,
    categoryDistribution
  };
}

async function getRoomCategoryDistribution(userId?: string | null, startDate?: Date, endDate?: Date) {
  const images = await prisma.roomImage.findMany({
    where: {
      ...(userId && { room: { property: { userId: parseInt(userId) } } }),
      ...(startDate && {
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    select: {
      room: { select: { name: true } },
    },
  });

  const distribution: Record<string, number> = {};
  for (const image of images) {
    const name = image.room.name;
    distribution[name] = (distribution[name] ?? 0) + 1;
  }

  return distribution;
}

async function getInventoryActivity(userId?: string | null, startDate?: Date, endDate?: Date) {
  const inventoryActivityTypes: ActivityType[] = [
    ActivityType.ADD_IMAGE,
    ActivityType.EDIT_IMAGE, 
    ActivityType.DELETE_IMAGE,
    ActivityType.ADD_ROOM,
    ActivityType.COMPLETE_INVENTORY
  ];

  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { 
      timestamp: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      } 
    }),
    activityType: {
      in: inventoryActivityTypes
    }
  };

  return await prisma.userActivity.findMany({
    where: whereClause,
    select: {
      id: true,
      activityType: true,
      entityId: true,
      timestamp: true,
      user: {
        select: {
          name: true,
          id: true
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 50
  });
}

async function getSyncStatusData() {
  const [syncedItems, pendingItems, failedItems, lastSyncTime] = await Promise.all([
    prisma.roomImage.count({ where: { syncStatus: 'synced' } }),
    prisma.roomImage.count({ where: { syncStatus: 'pending' } }),
    prisma.syncLog.count({ where: { syncStatus: 'failed' } }),
    prisma.syncLog.findFirst({
      where: { syncStatus: 'completed' },
      orderBy: { syncCompleted: 'desc' },
      select: { syncCompleted: true }
    })
  ]);

  return {
    syncedItems,
    pendingItems,
    failedItems,
    lastSyncTime: lastSyncTime?.syncCompleted?.toISOString() || null,
    isOnline: true // À adapter selon votre logique
  };
}

// 4. Fonctions pour les données temporelles
async function getDailyMetrics(startDate: Date, endDate: Date, userId?: string | null) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const metrics = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const [visits, items, responses] = await Promise.all([
      prisma.canvassingVisit.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
        }
      }),
      prisma.roomImage.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          ...(userId && { room: { property: { userId: parseInt(userId) } } })
        }
      }),
      prisma.canvassingVisit.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          responseReceived: 'positive',
          ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
        }
      })
    ]);

    metrics.push({
      date: date.toISOString().split('T')[0],
      visits,
      items,
      responses,
      performance: visits > 0 ? (responses / visits * 100) : 0
    });
  }

  return metrics;
}

// 5. Fonctions pour les données temps réel
async function getRecentActivities(limit: number = 20) {
  const activities = await prisma.userActivity.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      activityType: true,
      entityId: true,
      entityType: true,
      details: true,
      timestamp: true,
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return activities.map(activity => ({
    id: activity.id.toString(),
    userId: activity.user.id.toString(),
    userName: activity.user.name,
    actionType: activity.activityType,
    description: generateActivityDescription(activity),
    timestamp: activity.timestamp.toISOString(),
    metadata: {
      entityId: activity.entityId,
      entityType: activity.entityType,
      details: activity.details
    }
  }));
}

async function getSystemMetricsData(startDate: Date, endDate?: Date) {
  return await prisma.systemMetrics.findMany({
    where: {
      date: { 
        gte: startDate,
        ...(endDate && { lte: endDate })
      }
    },
    orderBy: { date: 'desc' }
  });
}

// Fonctions utilitaires
function calculatePerformanceScore(visits: number, positiveResponses: number, items: number): number {
  // If no activity, return 0
  if (visits === 0 && items === 0) return 0;

  // Score based on visits (50% of total)
  // Normalization: 100 visits = 50 points max
  const visitScore = Math.min((visits / 100) * 50, 50);

  // Score based on inventoried items (25% of total)
  // Normalization: 100 items = 25 points max
  const itemScore = Math.min((items / 100) * 25, 25);

  // Score based on positive response rate (25% of total)
  const responseRate = visits > 0 ? positiveResponses / visits : 0;
  const responseScore = responseRate * 25;

  // Total score (0-100)
  const totalScore = visitScore + itemScore + responseScore;

  return Math.min(Math.max(totalScore, 0), 100);
}

async function calculateAveragePerformance(startDate: Date, endDate?: Date): Promise<number> {
  const users = await getUsersWithPerformance(null, startDate, endDate);
  if (users.length === 0) return 0;
  
  const totalScore = users.reduce((sum, user) => sum + user.performance.performanceScore, 0);
  return totalScore / users.length;
}

function generateActivityDescription(activity: any): string {
  const activityDescriptions = {
    LOGIN: 'S\'est connecté',
    LOGOUT: 'S\'est déconnecté',
    CREATE_PROPERTY: 'A créé une propriété',
    EDIT_PROPERTY: 'A modifié une propriété',
    DELETE_PROPERTY: 'A supprimé une propriété',
    ADD_ROOM: 'A ajouté une pièce',
    ADD_IMAGE: 'A ajouté une image',
    CANVASSING_VISIT: 'A effectué une visite de démarchage',
    COMPLETE_INVENTORY: 'A terminé un inventaire'
  };
  
  return activityDescriptions[activity.activityType as keyof typeof activityDescriptions] || 'Activité inconnue';
}