// src/app/api/canvassing-visits/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { CanvassingService } from '@/lib/services/canvassingService';
import { prisma } from '@/lib/utils/prisma';
import { ResponseType } from '@prisma/client';

// GET: Get user-specific canvassing statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Admin can request stats for any user
    const period = searchParams.get('period') || 'all'; // all, today, week, month, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine which user's stats to get
    let targetUserId = user.id;
    
    if (userId && user.role === 'ADMIN') {
      // Admin can get stats for any user
      targetUserId = parseInt(userId);
    } else if (userId && parseInt(userId) !== user.id) {
      // Non-admin trying to access other user's stats
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get basic user stats
    const basicStats = await CanvassingService.getVisitStats(targetUserId);

    // Get period-specific stats
    const periodStats = await getPeriodStats(targetUserId, period, startDate, endDate);

    // Get user's recent visits
    const recentVisits = await CanvassingService.getVisitsByUser(targetUserId, 10);

    // Get user's best performing areas
    const topAreas = await getUserTopAreas(targetUserId);

    // Get user's contact method preferences
    const contactMethodPrefs = await getUserContactMethodStats(targetUserId);

    // Get user's activity timeline
    const activityTimeline = await getUserActivityTimeline(targetUserId);

    return NextResponse.json({
      userId: targetUserId,
      basicStats,
      periodStats,
      recentVisits: recentVisits.slice(0, 5), // Limit for API response
      topAreas,
      contactMethodPrefs,
      activityTimeline,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting user canvassing stats:', error);
    return NextResponse.json(
      { error: 'Failed to get user statistics' },
      { status: 500 }
    );
  }
}

// Helper function to get period-specific statistics
async function getPeriodStats(userId: number, period: string,  startDate?: string | null, endDate?: string | null) {
  try {
    let dateFilter: any = {};
    
    const now = new Date();
    
    switch (period) {
      case 'today':
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
        break;
      
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekStart };
        break;
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: monthStart };
        break;
      
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
        }
        break;
      
      default:
        // 'all' - no date filter
        break;
    }

    const where = { 
      visitUsers: { some: { userId } },
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
    };

    const [totalVisits, positiveResponses, negativeResponses, pendingResponses] = await Promise.all([
      prisma.canvassingVisit.count({ where }),
      prisma.canvassingVisit.count({ where: { ...where, responseReceived: ResponseType.positive} }),
      prisma.canvassingVisit.count({ where: { ...where, responseReceived: ResponseType.negative } }),
      prisma.canvassingVisit.count({ where: { ...where, responseReceived: null } })
    ]);

    const responseRate = totalVisits > 0 ? ((totalVisits - pendingResponses) / totalVisits) * 100 : 0;

    return {
      period,
      totalVisits,
      positiveResponses,
      negativeResponses,
      pendingResponses,
      responseRate: Math.round(responseRate * 10) / 10,
      dateRange: Object.keys(dateFilter).length > 0 ? dateFilter : null
    };

  } catch (error) {
    console.error('Error getting period stats:', error);
    return null;
  }
}

// Helper function to get user's top performing areas
// Optimized: single raw SQL query replaces N+1 per-area count queries
async function getUserTopAreas(userId: number) {
  try {
    const rows = await prisma.$queryRaw<{
      city: string | null;
      neighborhood: string | null;
      totalVisits: bigint;
      positiveResponses: bigint;
    }[]>`
      SELECT
        cv."city",
        cv."neighborhood",
        COUNT(cv.id)                                                       AS "totalVisits",
        COUNT(cv.id) FILTER (WHERE cv."responseReceived" = 'positive')     AS "positiveResponses"
      FROM "CanvassingVisit" cv
      INNER JOIN "CanvassingVisitUser" cvu ON cvu."visitId" = cv.id
      WHERE cvu."userId" = ${userId}
        AND cv."city" IS NOT NULL
      GROUP BY cv."city", cv."neighborhood"
      HAVING COUNT(cv.id) >= 2
      ORDER BY COUNT(cv.id) DESC
      LIMIT 5
    `;

    return rows
      .map((row) => {
        const totalVisits = Number(row.totalVisits);
        const positiveResponses = Number(row.positiveResponses);
        const successRate = totalVisits > 0 ? (positiveResponses / totalVisits) * 100 : 0;
        return {
          city: row.city,
          neighborhood: row.neighborhood,
          totalVisits,
          positiveResponses,
          successRate: Math.round(successRate * 10) / 10,
        };
      })
      .sort((a, b) => b.successRate - a.successRate);
  } catch (error) {
    console.error('Error getting user top areas:', error);
    return [];
  }
}

// Helper function to get user's contact method statistics
// Optimized: single raw SQL query replaces N per-method count queries
async function getUserContactMethodStats(userId: number) {
  try {
    const rows = await prisma.$queryRaw<{
      contactMethod: string;
      totalVisits: bigint;
      totalResponses: bigint;
      positiveResponses: bigint;
    }[]>`
      SELECT
        cv."contactMethod",
        COUNT(cv.id)                                                         AS "totalVisits",
        COUNT(cv.id) FILTER (WHERE cv."responseReceived" IS NOT NULL)        AS "totalResponses",
        COUNT(cv.id) FILTER (WHERE cv."responseReceived" = 'positive')       AS "positiveResponses"
      FROM "CanvassingVisit" cv
      INNER JOIN "CanvassingVisitUser" cvu ON cvu."visitId" = cv.id
      WHERE cvu."userId" = ${userId}
      GROUP BY cv."contactMethod"
      ORDER BY COUNT(cv.id) DESC
    `;

    return rows.map((row) => {
      const totalVisits = Number(row.totalVisits);
      const totalResponses = Number(row.totalResponses);
      const positiveResponses = Number(row.positiveResponses);
      const responseRate = totalVisits > 0 ? (totalResponses / totalVisits) * 100 : 0;
      const successRate = totalResponses > 0 ? (positiveResponses / totalResponses) * 100 : 0;
      return {
        contactMethod: row.contactMethod,
        totalVisits,
        totalResponses,
        positiveResponses,
        responseRate: Math.round(responseRate * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
      };
    });
  } catch (error) {
    console.error('Error getting contact method stats:', error);
    return [];
  }
}

// Helper function to get user's activity timeline
// Optimized: single query with groupBy instead of 60 individual count queries
async function getUserActivityTimeline(userId: number, days: number = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Single query: group visits by day
    const visitsByDay = await prisma.$queryRaw<{ day: string; visits: bigint; responses: bigint }[]>`
      SELECT
        TO_CHAR(cv."createdAt", 'YYYY-MM-DD') AS day,
        COUNT(cv.id) AS visits,
        COUNT(cv.id) FILTER (WHERE cv."responseReceived" IS NOT NULL) AS responses
      FROM "CanvassingVisit" cv
      INNER JOIN "CanvassingVisitUser" cvu ON cvu."visitId" = cv.id
      WHERE cvu."userId" = ${userId}
        AND cv."createdAt" >= ${startDate}
      GROUP BY TO_CHAR(cv."createdAt", 'YYYY-MM-DD')
      ORDER BY day ASC
    `;

    // Build the full 30-day timeline (fill gaps with 0s)
    const dataMap = new Map(
      visitsByDay.map(r => [r.day, { visits: Number(r.visits), responses: Number(r.responses) }])
    );

    const timeline = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      const data = dataMap.get(key) ?? { visits: 0, responses: 0 };
      return {
        date: key,
        visits: data.visits,
        responses: data.responses,
        responseRate: data.visits > 0 ? Math.round((data.responses / data.visits) * 100) : 0
      };
    });

    return timeline;

  } catch (error) {
    console.error('Error getting activity timeline:', error);
    return [];
  }
}