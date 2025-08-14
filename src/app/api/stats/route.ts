// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

// GET: Récupérer toutes les statistiques pour le dashboard
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    
    if (authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized access. Admin privileges required.' 
      }, { status: 403 });
    }

    // Récupérer les paramètres de query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const userId = searchParams.get('userId');
    
    // Calculer les dates basées sur la période
    const now = new Date();
    const startDate = getStartDateByPeriod(period, now);

    // Exécuter toutes les requêtes en parallèle
    const [
      // 1. Données utilisateurs & équipe
      usersData,
      teamStats,
      userActivities,
      
      // 2. Données maildrop
      canvassingVisits,
      canvassingStats,
      responseDistribution,
      contactMethodStats,
      visitHours,
      
      // 3. Données inventory
      inventoryStats,
      inventoryActivity,
      syncStatus,
      
      // 4. Données temporelles
      dailyMetrics,
      
      // 5. Données temps réel
      recentActivities,
      
      // 6. Métriques système
      systemMetrics
    ] = await Promise.all([
      // 1. Users & Team
      getUsersWithPerformance(userId, startDate),
      getTeamStats(startDate),
      getUserActivitiesSummary(userId, startDate),
      
      // 2. Maildrop
      getCanvassingVisits(userId, startDate),
      getCanvassingStatistics(userId, startDate),
      getResponseTypeDistribution(userId, startDate),
      getContactMethodPerformance(userId, startDate),
      getVisitHourDistribution(userId, startDate),
      
      // 3. Inventory
      getInventoryStatistics(userId, startDate),
      getInventoryActivity(userId, startDate),
      getSyncStatusData(),
      
      // 4. Temporal
      getDailyMetrics(startDate, now, userId),
      
      // 5. Real-time
      getRecentActivities(20),
      
      // 6. System
      getSystemMetricsData(startDate)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        // Métadonnées de la requête
        metadata: {
          period,
          userId: userId || 'all',
          generatedAt: now.toISOString(),
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        },
        
        // 1. Données utilisateurs & équipe
        team: {
          users: usersData,
          stats: teamStats,
          activities: userActivities
        },
        
        // 2. Données maildrop
        maildrop: {
          visits: canvassingVisits,
          stats: canvassingStats,
          responses: responseDistribution,
          contactMethods: contactMethodStats,
          visitHours: visitHours
        },
        
        // 3. Données inventory
        inventory: {
          stats: inventoryStats,
          activity: inventoryActivity,
          sync: syncStatus
        },
        
        // 4. Données temporelles
        temporal: {
          daily: dailyMetrics,
          trends: calculateTrends(dailyMetrics)
        },
        
        // 5. Données temps réel
        realTime: {
          activities: recentActivities,
          onlineUsers: await getOnlineUsersCount(),
          todayStats: await getTodayStats()
        },
        
        // 6. Métriques système
        system: systemMetrics
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error while fetching dashboard statistics' 
    }, { status: 500 });
  }
}

// Fonction utilitaire pour calculer la date de début selon la période
function getStartDateByPeriod(period: string, now: Date): Date {
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

// 1. Fonctions pour les données utilisateurs & équipe
async function getUsersWithPerformance(userId?: string | null, startDate?: Date) {
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
        where: startDate ? { joinedAt: { gte: startDate } } : undefined,
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
        where: startDate ? { createdAt: { gte: startDate } } : undefined,
        select: {
          imageCount: true,
          inventoryStatus: true
        }
      },
      activities: {
        where: startDate ? { timestamp: { gte: startDate } } : undefined,
        select: {
          timestamp: true,
          activityType: true
        }
      }
    }
  });

  return users.map(user => {
    const totalVisits = user.canvassingVisits.length;
    const positiveResponses = user.canvassingVisits.filter(
      cv => cv.visit.responseReceived === 'positive'
    ).length;
    const totalItems = user.properties.reduce((sum, p) => sum + p.imageCount, 0);
    const completedInventories = user.properties.filter(
      p => p.inventoryStatus === 'COMPLETED' || p.inventoryStatus === 'FINALIZED'
    ).length;
    
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
        responseRate: totalVisits > 0 ? (positiveResponses / totalVisits * 100) : 0,
        performanceScore: calculatePerformanceScore(totalVisits, positiveResponses, totalItems),
        lastActivity: user.activities.length > 0 ? 
          Math.max(...user.activities.map(a => new Date(a.timestamp).getTime())) : null
      }
    };
  });
}

async function getTeamStats(startDate: Date) {
  const [totalUsers, activeUsers, newUsers, avgPerformance] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    calculateAveragePerformance(startDate)
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

async function getUserActivitiesSummary(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { timestamp: { gte: startDate } })
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
async function getCanvassingVisits(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(startDate && { createdAt: { gte: startDate } }),
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

async function getCanvassingStatistics(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(startDate && { createdAt: { gte: startDate } }),
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
    responseRate: totalVisits > 0 ? ((positiveResponses / totalVisits) * 100) : 0
  };
}

async function getResponseTypeDistribution(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(startDate && { createdAt: { gte: startDate } }),
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

async function getContactMethodPerformance(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(startDate && { createdAt: { gte: startDate } }),
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

async function getVisitHourDistribution(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(userId && { visitUsers: { some: { userId: parseInt(userId) } } })
  };

  const visits = await prisma.$queryRaw<Array<{hour: number, count: bigint, visit_type: string}>>`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count,
      'visit' as visit_type
    FROM canvassing_visits 
    WHERE ${startDate ? Prisma.sql`created_at >= ${startDate}` : Prisma.sql`1=1`}
    ${userId ? Prisma.sql`AND EXISTS (SELECT 1 FROM canvassing_visit_users cvu WHERE cvu.visit_id = canvassing_visits.id AND cvu.user_id = ${parseInt(userId)})` : Prisma.empty}
    GROUP BY EXTRACT(HOUR FROM created_at)
    
    UNION ALL
    
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count,
      'revisit' as visit_type
    FROM revisits 
    WHERE ${startDate ? Prisma.sql`created_at >= ${startDate}` : Prisma.sql`1=1`}
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
async function getInventoryStatistics(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { createdAt: { gte: startDate } })
  };

  const [totalItems, totalLocations, categoryDistribution] = await Promise.all([
    prisma.roomImage.count({ where: startDate ? { createdAt: { gte: startDate } } : undefined }),
    prisma.property.count({ where: whereClause }),
    getRoomCategoryDistribution(userId, startDate)
  ]);

  return {
    totalItems,
    totalLocations,
    totalCategories: Object.keys(categoryDistribution).length,
    categoryDistribution
  };
}

async function getRoomCategoryDistribution(userId?: string | null, startDate?: Date) {
  const whereClause = {
    ...(userId && { property: { userId: parseInt(userId) } }),
    ...(startDate && { createdAt: { gte: startDate } })
  };

  const rooms = await prisma.room.groupBy({
    where: whereClause,
    by: ['name'],
    _count: { id: true }
  });

  return Object.fromEntries(
    rooms.map(r => [r.name, r._count.id])
  );
}

async function getInventoryActivity(userId?: string | null, startDate?: Date) {
  const inventoryActivityTypes: ActivityType[] = [
    ActivityType.ADD_IMAGE,
    ActivityType.EDIT_IMAGE, 
    ActivityType.DELETE_IMAGE,
    ActivityType.ADD_ROOM,
    ActivityType.COMPLETE_INVENTORY
  ];

  const whereClause = {
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { timestamp: { gte: startDate } }),
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

async function getOnlineUsersCount(): Promise<number> {
  // Considérer qu'un utilisateur est en ligne s'il a eu une activité dans les 15 dernières minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const activeUsers = await prisma.userActivity.findMany({
    where: {
      timestamp: { gte: fifteenMinutesAgo }
    },
    select: { userId: true },
    distinct: ['userId']
  });
  
  return activeUsers.length;
}

async function getTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayVisits, todayItems, todayUsers] = await Promise.all([
    prisma.canvassingVisit.count({ where: { createdAt: { gte: today } } }),
    prisma.roomImage.count({ where: { createdAt: { gte: today } } }),
    prisma.userActivity.findMany({
      where: { timestamp: { gte: today } },
      select: { userId: true },
      distinct: ['userId']
    })
  ]);

  return {
    onlineUsers: await getOnlineUsersCount(),
    todayVisits,
    todayItems,
    activeUserIds: todayUsers.map(u => u.userId.toString())
  };
}

// 6. Fonctions pour les métriques système
async function getSystemMetricsData(startDate: Date) {
  return await prisma.systemMetrics.findMany({
    where: {
      date: { gte: startDate }
    },
    orderBy: { date: 'desc' }
  });
}

// Fonctions utilitaires
function calculatePerformanceScore(visits: number, positiveResponses: number, items: number): number {
  const responseRate = visits > 0 ? (positiveResponses / visits) : 0;
  const activityScore = Math.min((visits + items) / 100, 1);
  return (responseRate * 0.7 + activityScore * 0.3) * 100;
}

async function calculateAveragePerformance(startDate: Date): Promise<number> {
  const users = await getUsersWithPerformance(null, startDate);
  if (users.length === 0) return 0;
  
  const totalScore = users.reduce((sum, user) => sum + user.performance.performanceScore, 0);
  return totalScore / users.length;
}

function calculateTrends(dailyMetrics: any[]) {
  if (dailyMetrics.length < 2) return { visitsTrend: 0, itemsTrend: 0, performanceTrend: 0 };
  
  const first = dailyMetrics[0];
  const last = dailyMetrics[dailyMetrics.length - 1];
  
  const visitsTrend = first.visits > 0 ? ((last.visits - first.visits) / first.visits) * 100 : 0;
  const itemsTrend = first.items > 0 ? ((last.items - first.items) / first.items) * 100 : 0;
  const performanceTrend = first.performance > 0 ? ((last.performance - first.performance) / first.performance) * 100 : 0;
  
  return { visitsTrend, itemsTrend, performanceTrend };
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

// Import Prisma for raw queries
import { Prisma, ActivityType } from '@prisma/client';