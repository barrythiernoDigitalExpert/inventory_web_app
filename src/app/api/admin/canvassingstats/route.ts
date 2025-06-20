// src/app/api/admin/canvassing-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { CanvassingService } from '@/lib/services/canvassingService';
import { ProximityService } from '@/lib/services/proximityService';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

// GET: Get comprehensive admin statistics for canvassing
export async function GET(request: NextRequest) {
  try {
   const authResult = await verifyJwtAuth(request)
          if (authResult.error) {
            return authResult.error
          }
      
          const user = authResult.user

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Optional: get stats for specific user
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get admin dashboard data
    const dashboardData = await CanvassingService.getAdminDashboardData();

    // Get time-based statistics if date range provided
    let timeBasedStats = null;
    const parsedUserId = userId ? parseInt(userId) : undefined;
    if (startDate && endDate) {
      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
       userId:  parsedUserId ,
      };

      const visitsInRange = await CanvassingService.getVisits(filters);
      timeBasedStats = {
        totalVisits: visitsInRange.totalCount,
        visits: visitsInRange.visits,
        dateRange: { startDate, endDate }
      };
    }

    // Get geographical analysis
    const geoAnalysis = await getGeographicalAnalysis();

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics();

    // Get contact method effectiveness
    const contactMethodStats = await getContactMethodEffectiveness();

    return NextResponse.json({
      ...dashboardData,
      timeBasedStats,
      geoAnalysis,
      performanceMetrics,
      contactMethodStats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting admin canvassing stats:', error);
    return NextResponse.json(
      { error: 'Failed to get admin statistics' },
      { status: 500 }
    );
  }
}

// Helper function to get geographical analysis
async function getGeographicalAnalysis() {
  try {
    // Get visit distribution by city/area
    const cityDistribution = await prisma.canvassingVisit.groupBy({
      by: ['city'],
      where: {
        city: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get neighborhood distribution
    const neighborhoodDistribution = await prisma.canvassingVisit.groupBy({
      by: ['neighborhood'],
      where: {
        neighborhood: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Calculate coverage density for major areas
    const densityAnalysis = await calculateAreaDensity();

    return {
      cityDistribution: cityDistribution.map(item => ({
        city: item.city,
        visitCount: item._count.id
      })),
      neighborhoodDistribution: neighborhoodDistribution.map(item => ({
        neighborhood: item.neighborhood,
        visitCount: item._count.id
      })),
      densityAnalysis
    };

  } catch (error) {
    console.error('Error getting geographical analysis:', error);
    return null;
  }
}

// Helper function to calculate area density
async function calculateAreaDensity() {
  try {
    // Get all visits with coordinates
    const visits = await prisma.canvassingVisit.findMany({
      select: {
        latitude: true,
        longitude: true,
        city: true
      }
    });

    if (visits.length === 0) return null;

    // Group visits by approximate area (using rounded coordinates)
    const areaGroups: { [key: string]: any[] } = {};
    
    visits.forEach(visit => {
      // Round to 2 decimal places for grouping (~1km accuracy)
      const areaKey = `${Math.round(visit.latitude * 100) / 100}_${Math.round(visit.longitude * 100) / 100}`;
      if (!areaGroups[areaKey]) {
        areaGroups[areaKey] = [];
      }
      areaGroups[areaKey].push(visit);
    });

    // Calculate density metrics
    const densityMetrics = Object.entries(areaGroups).map(([areaKey, areaVisits]) => {
      const [lat, lng] = areaKey.split('_').map(Number);
      return {
        centerLat: lat,
        centerLng: lng,
        visitCount: areaVisits.length,
        density: areaVisits.length, // visits per ~1km² area
        primaryCity: areaVisits[0]?.city
      };
    }).sort((a, b) => b.visitCount - a.visitCount);

    return {
      totalAreas: densityMetrics.length,
      highDensityAreas: densityMetrics.filter(area => area.visitCount >= 5).length,
      averageVisitsPerArea: visits.length / densityMetrics.length,
      topDensityAreas: densityMetrics.slice(0, 5)
    };

  } catch (error) {
    console.error('Error calculating area density:', error);
    return null;
  }
}

// Helper function to get performance metrics
async function getPerformanceMetrics() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get visits for different time periods
    const [totalVisits, last30Days, last7Days, todayVisits] = await Promise.all([
      prisma.canvassingVisit.count(),
      prisma.canvassingVisit.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.canvassingVisit.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.canvassingVisit.count({
        where: { 
          createdAt: { 
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      })
    ]);

    // Calculate trends
    const dailyAverage30Days = last30Days / 30;
    const dailyAverage7Days = last7Days / 7;
    const weeklyTrend = ((dailyAverage7Days - dailyAverage30Days) / dailyAverage30Days) * 100;

    // Get top performers
    const topPerformers = await prisma.canvassingVisit.groupBy({
      by: ['userId', 'userName'],
      _count: {
        id: true
      },
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get response rate trends
    const responseRateData = await getResponseRateTrends();

    return {
      totalVisits,
      last30Days,
      last7Days,
      todayVisits,
      dailyAverage30Days: Math.round(dailyAverage30Days * 10) / 10,
      dailyAverage7Days: Math.round(dailyAverage7Days * 10) / 10,
      weeklyTrend: Math.round(weeklyTrend * 10) / 10,
      topPerformers: topPerformers.map(performer => ({
        userId: performer.userId,
        userName: performer.userName,
        visitCount: performer._count.id
      })),
      responseRateData
    };

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return null;
  }
}

// Helper function to get response rate trends
async function getResponseRateTrends() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get daily response rates for the last 30 days
    const dailyStats = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [totalVisits, respondedVisits] = await Promise.all([
        prisma.canvassingVisit.count({
          where: {
            createdAt: { gte: date, lt: nextDate }
          }
        }),
        prisma.canvassingVisit.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
            responseReceived: { not: null }
          }
        })
      ]);

      const responseRate = totalVisits > 0 ? (respondedVisits / totalVisits) * 100 : 0;

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        totalVisits,
        respondedVisits,
        responseRate: Math.round(responseRate * 10) / 10
      });
    }

    return dailyStats;

  } catch (error) {
    console.error('Error getting response rate trends:', error);
    return [];
  }
}

// Helper function to get contact method effectiveness
async function getContactMethodEffectiveness() {
  try {
    const contactMethodStats = await prisma.canvassingVisit.groupBy({
      by: ['contactMethod'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get response rates by contact method
    const methodEffectiveness = await Promise.all(
      contactMethodStats.map(async (method) => {
        const [totalVisits, positiveResponses, totalResponses] = await Promise.all([
          prisma.canvassingVisit.count({
            where: { contactMethod: method.contactMethod }
          }),
          prisma.canvassingVisit.count({
            where: { 
              contactMethod: method.contactMethod,
              responseReceived: 'positive'
            }
          }),
          prisma.canvassingVisit.count({
            where: { 
              contactMethod: method.contactMethod,
              responseReceived: { not: null }
            }
          })
        ]);

        const responseRate = totalVisits > 0 ? (totalResponses / totalVisits) * 100 : 0;
        const positiveRate = totalResponses > 0 ? (positiveResponses / totalResponses) * 100 : 0;

        return {
          contactMethod: method.contactMethod,
          totalVisits,
          totalResponses,
          positiveResponses,
          responseRate: Math.round(responseRate * 10) / 10,
          positiveRate: Math.round(positiveRate * 10) / 10,
          effectiveness: Math.round((responseRate * positiveRate / 100) * 10) / 10
        };
      })
    );

    return methodEffectiveness.sort((a, b) => b.effectiveness - a.effectiveness);

  } catch (error) {
    console.error('Error getting contact method effectiveness:', error);
    return [];
  }
}