// src/app/api/canvassing-visits/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { CanvassingService } from '@/lib/services/canvassingService';
import { prisma } from '@/lib/utils/prisma';

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

    const where = { userId, ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) };

    const [totalVisits, positiveResponses, negativeResponses, pendingResponses] = await Promise.all([
      prisma.canvassingVisit.count({ where }),
      prisma.canvassingVisit.count({ where: { ...where, responseReceived: 'positive' } }),
      prisma.canvassingVisit.count({ where: { ...where, responseReceived: 'negative' } }),
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
async function getUserTopAreas(userId: number) {
  try {
    // Get areas with highest positive response rates
    const areaStats = await prisma.canvassingVisit.groupBy({
      by: ['city', 'neighborhood'],
      where: { 
        userId,
        city: { not: null }
      },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: { gte: 2 } // Only areas with at least 2 visits
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get response rates for each area
    const areaDetails = await Promise.all(
      areaStats.map(async (area) => {
        const [totalVisits, positiveResponses] = await Promise.all([
          prisma.canvassingVisit.count({
            where: {
              userId,
              city: area.city,
              neighborhood: area.neighborhood
            }
          }),
          prisma.canvassingVisit.count({
            where: {
              userId,
              city: area.city,
              neighborhood: area.neighborhood,
              responseReceived: 'positive'
            }
          })
        ]);

        const successRate = totalVisits > 0 ? (positiveResponses / totalVisits) * 100 : 0;

        return {
          city: area.city,
          neighborhood: area.neighborhood,
          totalVisits,
          positiveResponses,
          successRate: Math.round(successRate * 10) / 10
        };
      })
    );

    return areaDetails.sort((a, b) => b.successRate - a.successRate);

  } catch (error) {
    console.error('Error getting user top areas:', error);
    return [];
  }
}

// Helper function to get user's contact method statistics
async function getUserContactMethodStats(userId: number) {
  try {
    const methodStats = await prisma.canvassingVisit.groupBy({
      by: ['contactMethod'],
      where: { userId },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get effectiveness for each method
    const methodDetails = await Promise.all(
      methodStats.map(async (method) => {
        const [totalVisits, positiveResponses, totalResponses] = await Promise.all([
          prisma.canvassingVisit.count({
            where: { userId, contactMethod: method.contactMethod }
          }),
          prisma.canvassingVisit.count({
            where: { 
              userId, 
              contactMethod: method.contactMethod,
              responseReceived: 'positive'
            }
          }),
          prisma.canvassingVisit.count({
            where: { 
              userId, 
              contactMethod: method.contactMethod,
              responseReceived: { not: null }
            }
          })
        ]);

        const responseRate = totalVisits > 0 ? (totalResponses / totalVisits) * 100 : 0;
        const successRate = totalResponses > 0 ? (positiveResponses / totalResponses) * 100 : 0;

        return {
          contactMethod: method.contactMethod,
          totalVisits,
          totalResponses,
          positiveResponses,
          responseRate: Math.round(responseRate * 10) / 10,
          successRate: Math.round(successRate * 10) / 10
        };
      })
    );

    return methodDetails;

  } catch (error) {
    console.error('Error getting contact method stats:', error);
    return [];
  }
}

// Helper function to get user's activity timeline
async function getUserActivityTimeline(userId: number, days: number = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const timeline = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [visits, responses] = await Promise.all([
        prisma.canvassingVisit.count({
          where: {
            userId,
            createdAt: { gte: date, lt: nextDate }
          }
        }),
        prisma.canvassingVisit.count({
          where: {
            userId,
            createdAt: { gte: date, lt: nextDate },
            responseReceived: { not: null }
          }
        })
      ]);

      timeline.push({
        date: date.toISOString().split('T')[0],
        visits,
        responses,
        responseRate: visits > 0 ? Math.round((responses / visits) * 100) : 0
      });
    }

    return timeline;

  } catch (error) {
    console.error('Error getting activity timeline:', error);
    return [];
  }
}