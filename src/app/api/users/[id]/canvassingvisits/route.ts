// src/app/api/users/[userId]/canvassing-visits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { CanvassingService } from '@/lib/services/canvassingService';
import { ContactMethod, ResponseType } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';

// GET: Get all canvassing visits for a specific user
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: number }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true }
    });

    if (!requestingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const params = await props.params;
        const userId = (params.userId);
    const { searchParams } = new URL(request.url);

    // Authorization check - users can only access their own visits unless they're admin
    if (requestingUser.role !== 'ADMIN' && userId !== requestingUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Parse query parameters for filtering
    const contactMethod = searchParams.get('contactMethod') as ContactMethod;
    const responseReceived = searchParams.get('responseReceived') as ResponseType;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeStats = searchParams.get('includeStats') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filters
    const filters: any = {
      userId: userId,
      limit,
      offset
    };

    if (contactMethod) filters.contactMethod = contactMethod;
    if (responseReceived !== null) filters.responseReceived = responseReceived;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Get visits
    const visitsResult = await CanvassingService.getVisits(filters);

    // Get user statistics if requested
    let userStats = null;
    if (includeStats) {
      userStats = await CanvassingService.getVisitStats(userId);
    }

    // Get user activity summary
    const activitySummary = await getUserActivitySummary(userId);

    const response = {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      visits: visitsResult.visits,
      pagination: {
        totalCount: visitsResult.totalCount,
        limit,
        offset,
        hasMore: visitsResult.hasMore,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(visitsResult.totalCount / limit)
      },
      filters: {
        contactMethod,
        responseReceived,
        startDate,
        endDate,
        sortBy,
        sortOrder
      },
      activitySummary,
      ...(userStats && { stats: userStats })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting user visits:', error);
    return NextResponse.json(
      { error: 'Failed to get user visits' },
      { status: 500 }
    );
  }
}

// Helper function to get user activity summary
async function getUserActivitySummary(userId: number) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalVisits,
      last30DaysVisits,
      last7DaysVisits,
      todayVisits,
      firstVisit,
      lastVisit,
      totalCities,
      totalNeighborhoods
    ] = await Promise.all([
      // Total visits
      prisma.canvassingVisit.count({ where: { userId } }),
      
      // Last 30 days
      prisma.canvassingVisit.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Last 7 days
      prisma.canvassingVisit.count({
        where: { userId, createdAt: { gte: sevenDaysAgo } }
      }),
      
      // Today
      prisma.canvassingVisit.count({
        where: { userId, createdAt: { gte: today } }
      }),
      
      // First visit
      prisma.canvassingVisit.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, houseName: true }
      }),
      
      // Last visit
      prisma.canvassingVisit.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, houseName: true }
      }),
      
      // Unique cities
      prisma.canvassingVisit.findMany({
        where: { userId, city: { not: null } },
        select: { city: true },
        distinct: ['city']
      }),
      
      // Unique neighborhoods
      prisma.canvassingVisit.findMany({
        where: { userId, neighborhood: { not: null } },
        select: { neighborhood: true },
        distinct: ['neighborhood']
      })
    ]);

    // Calculate averages
    const daysSinceFirstVisit = firstVisit 
      ? Math.ceil((now.getTime() - firstVisit.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    
    const averageVisitsPerDay = daysSinceFirstVisit > 0 ? totalVisits / daysSinceFirstVisit : 0;
    const recent30DayAverage = last30DaysVisits / 30;
    const recent7DayAverage = last7DaysVisits / 7;

    // Activity trend
    let activityTrend = 'stable';
    if (recent7DayAverage > recent30DayAverage * 1.2) {
      activityTrend = 'increasing';
    } else if (recent7DayAverage < recent30DayAverage * 0.8) {
      activityTrend = 'decreasing';
    }

    return {
      totalVisits,
      visitsLast30Days: last30DaysVisits,
      visitsLast7Days: last7DaysVisits,
      visitsTodayCount: todayVisits,
      averageVisitsPerDay: Math.round(averageVisitsPerDay * 100) / 100,
      recent30DayAverage: Math.round(recent30DayAverage * 100) / 100,
      recent7DayAverage: Math.round(recent7DayAverage * 100) / 100,
      activityTrend,
      firstVisit: firstVisit ? {
        date: firstVisit.createdAt,
        houseName: firstVisit.houseName,
        daysSince: daysSinceFirstVisit
      } : null,
      lastVisit: lastVisit ? {
        date: lastVisit.createdAt,
        houseName: lastVisit.houseName,
        daysSince: Math.ceil((now.getTime() - lastVisit.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      } : null,
      geographicCoverage: {
        totalCities: totalCities.length,
        totalNeighborhoods: totalNeighborhoods.length,
        cities: totalCities.map(c => c.city).filter(Boolean),
        neighborhoods: totalNeighborhoods.map(n => n.neighborhood).filter(Boolean)
      }
    };

  } catch (error) {
    console.error('Error getting user activity summary:', error);
    return null;
  }
}