// src/app/api/users/[id]/canvassingvisits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ContactMethod, ResponseType, ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'
import { CanvassingService } from '@/lib/services/canvassingService'

// GET: Get all canvassing visits for a specific user with revisits support
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    user = authResult.user
    const params = await props.params
    const targetUserId = parseInt(params.id)
    const { searchParams } = new URL(request.url)

    console.log(`Fetching visits for user ${targetUserId} by user: ${user.id}`)

    // Authorization check - users can only access their own visits unless they're admin
    if (user.id !== targetUserId && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You can only view your own visits',
          processingTime: Date.now() - startTime
        },
        { status: 403 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          processingTime: Date.now() - startTime
        },
        { status: 404 }
      )
    }

    // Parse query parameters for filtering
    const contactMethod = searchParams.get('contactMethod') as ContactMethod
    const responseReceived = searchParams.get('responseReceived') as ResponseType
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeRevisits = searchParams.get('includeRevisits') !== 'false'
    const includeStats = searchParams.get('includeStats') === 'true'

    // Get visit IDs where user is a member
    const userVisitIds = await prisma.canvassingVisitUser.findMany({
      where: { userId: targetUserId },
      select: { visitId: true }
    })

    // Build where clause
    let visitWhereClause: any = {
      id: { in: userVisitIds.map(uv => uv.visitId) }
    }

    // Add filters
    if (contactMethod) visitWhereClause.contactMethod = contactMethod
    if (responseReceived) visitWhereClause.responseReceived = responseReceived
    if (startDate || endDate) {
      visitWhereClause.createdAt = {}
      if (startDate) visitWhereClause.createdAt.gte = new Date(startDate)
      if (endDate) visitWhereClause.createdAt.lte = new Date(endDate)
    }

    // Get visits with or without revisits based on flag
    const includeClause = {
      visitUsers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          joinedAt: 'asc' as const
        }
      },
      additionalComments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc' as const
        }
      },
      ...(includeRevisits ? {
        revisits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc' as const
          }
        }
      } : {})
    }

    const visits = await prisma.canvassingVisit.findMany({
      where: visitWhereClause,
      include: includeClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.canvassingVisit.count({
      where: visitWhereClause
    })

    // Get visit configuration for revisit logic
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168

    // Get user's revisits performed (using the new Revisit model)
    const userRevisits = includeRevisits ? await prisma.revisit.findMany({
      where: { userId: targetUserId },
      include: {
        originalVisit: {
          select: {
            id: true,
            houseName: true,
            contactMethod: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) : []

    // Enrich visits with computed fields
    const enrichedVisits = visits.map((visit: any) => {
      const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
      const canRevisit = (visit.responseReceived === 'pending' || visit.responseReceived === 'no_response' || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours

      let enrichedRevisits: any[] = []
      if (includeRevisits && visit.revisits) {
        enrichedRevisits = visit.revisits.map((revisit: any) => ({
          ...revisit,
          contactMethods: [
            revisit.contactMethod1,
            revisit.contactMethod2,
            revisit.contactMethod3,
            revisit.contactMethod4
          ].filter(Boolean),
          hoursSinceOriginal: Math.round((revisit.createdAt.getTime() - visit.createdAt.getTime()) / (1000 * 60 * 60))
        }))
      }

      return {
        ...visit,
        userNames: visit.visitUsers.map((vu: any) => vu.userName).join(', '),
        users: visit.visitUsers.map((vu: any) => ({
          id: vu.user.id,
          name: vu.user.name,
          email: vu.user.email,
          isCreator: vu.isCreator,
          joinedAt: vu.joinedAt
        })),
        contactMethods: [
          visit.contactMethod,
          visit.contactMethod2,
          visit.contactMethod3,
          visit.contactMethod4
        ].filter(Boolean),
        canRevisit,
        hoursSinceVisit: Math.round(hoursSinceVisit),
        hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit),
        ...(includeRevisits ? {
          revisitsCount: visit.revisits?.length || 0,
          revisits: enrichedRevisits
        } : {}),
        commentsCount: visit.additionalComments.length + (visit.comments ? 1 : 0),
        initialComment: visit.comments,
        additionalComments: visit.additionalComments
      }
    })

    // Get user statistics
    const userStats = {
      totalVisits: totalCount,
      totalRevisitsPerformed: userRevisits.length,
      visitsWithRevisits: includeRevisits ? enrichedVisits.filter((visit: any) => visit.revisitsCount > 0).length : 0,
      responseBreakdown: {
        positive: visits.filter(v => v.responseReceived === 'positive').length,
        negative: visits.filter(v => v.responseReceived === 'negative').length,
        no_response: visits.filter(v => v.responseReceived === 'no_response').length,
        pending: visits.filter(v => v.responseReceived === null || v.responseReceived === 'pending').length
      }
    }

    // Get user activity summary
    const activitySummary = await getUserActivitySummary(targetUserId)

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.CANVASSING_VISIT,
      undefined,
      {
        action: 'view_user_visits',
        targetUserId,
        resultCount: visits.length,
        totalAvailable: totalCount,
        includeRevisits,
        filters: { contactMethod, responseReceived, startDate, endDate },
        userRole: user.role
      },
      context.deviceType,
      processingTime
    )

    console.log(`Retrieved ${visits.length} visits for user ${targetUserId} in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser,
        visits: enrichedVisits,
        userRevisits: includeRevisits ? userRevisits.map(revisit => ({
          ...revisit,
          contactMethods: [
            revisit.contactMethod1,
            revisit.contactMethod2,
            revisit.contactMethod3,
            revisit.contactMethod4
          ].filter(Boolean),
          hoursSinceOriginal: Math.round((revisit.createdAt.getTime() - revisit.originalVisit.createdAt.getTime()) / (1000 * 60 * 60))
        })) : [],
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        visitConfig: {
          revisitDelayHours
        },
        userStats,
        activitySummary
      },
      processingTime
    })

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
      totalRevisits,
      last30DaysRevisits,
      firstVisit,
      lastVisit,
      totalCities,
      totalNeighborhoods,
      contactMethodBreakdown,
      responseBreakdown
    ] = await Promise.all([
      // Total visits
      prisma.canvassingVisit.count({ 
        where: { 
          visitUsers: { 
            some: { userId } 
          } 
        } 
      }),
      
      // Last 30 days visits
      prisma.canvassingVisit.count({
        where: { 
          visitUsers: { 
            some: { userId } 
          },
          createdAt: { gte: thirtyDaysAgo } 
        }
      }),
      
      // Last 7 days visits
      prisma.canvassingVisit.count({
        where: { 
          visitUsers: { 
            some: { userId } 
          },
          createdAt: { gte: sevenDaysAgo } 
        }
      }),
      
      // Today visits
      prisma.canvassingVisit.count({
        where: { 
          visitUsers: { 
            some: { userId } 
          },
          createdAt: { gte: today } 
        }
      }),

      // Total revisits performed by user
      prisma.revisit.count({
        where: { userId }
      }),

      // Last 30 days revisits
      prisma.revisit.count({
        where: { 
          userId,
          createdAt: { gte: thirtyDaysAgo } 
        }
      }),
      
      // First visit
      prisma.canvassingVisit.findFirst({
        where: { 
          visitUsers: { 
            some: { userId } 
          } 
        },
        orderBy: { createdAt: 'asc' },
        select: { 
          createdAt: true, 
          houseName: true, 
          contactMethod: true,
          contactMethod2: true,
          contactMethod3: true,
          contactMethod4: true
        }
      }),
      
      // Last visit
      prisma.canvassingVisit.findFirst({
        where: { 
          visitUsers: { 
            some: { userId } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        select: { 
          createdAt: true, 
          houseName: true, 
          contactMethod: true,
          contactMethod2: true,
          contactMethod3: true,
          contactMethod4: true
        }
      }),
      
      // Unique cities
      prisma.canvassingVisit.findMany({
        where: { 
          visitUsers: { 
            some: { userId } 
          },
          city: { not: null } 
        },
        select: { city: true },
        distinct: ['city']
      }),
      
      // Unique neighborhoods
      prisma.canvassingVisit.findMany({
        where: { 
          visitUsers: { 
            some: { userId } 
          },
          neighborhood: { not: null } 
        },
        select: { neighborhood: true },
        distinct: ['neighborhood']
      }),

      // Contact method breakdown
      prisma.canvassingVisit.groupBy({
        by: ['contactMethod'],
        where: { 
          visitUsers: { 
            some: { userId } 
          } 
        },
        _count: {
          contactMethod: true
        }
      }),

      // Response breakdown
      prisma.canvassingVisit.groupBy({
        by: ['responseReceived'],
        where: { 
          visitUsers: { 
            some: { userId } 
          } 
        },
        _count: {
          responseReceived: true
        }
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

    // Format contact method breakdown
    const contactMethodStats: Record<string, number> = {};
    contactMethodBreakdown.forEach(item => {
      contactMethodStats[item.contactMethod] = item._count.contactMethod;
    });

    // Format response breakdown
    const responseStats: Record<string, number> = {};
    responseBreakdown.forEach(item => {
      responseStats[item.responseReceived || 'pending'] = item._count.responseReceived;
    });

    return {
      totalVisits,
      visitsLast30Days: last30DaysVisits,
      visitsLast7Days: last7DaysVisits,
      visitsTodayCount: todayVisits,
      totalRevisits,
      revisitsLast30Days: last30DaysRevisits,
      averageVisitsPerDay: Math.round(averageVisitsPerDay * 100) / 100,
      recent30DayAverage: Math.round(recent30DayAverage * 100) / 100,
      recent7DayAverage: Math.round(recent7DayAverage * 100) / 100,
      activityTrend,
      firstVisit: firstVisit ? {
        date: firstVisit.createdAt,
        houseName: firstVisit.houseName,
        contactMethods: [
          firstVisit.contactMethod,
          firstVisit.contactMethod2,
          firstVisit.contactMethod3,
          firstVisit.contactMethod4
        ].filter(Boolean),
        daysSince: daysSinceFirstVisit
      } : null,
      lastVisit: lastVisit ? {
        date: lastVisit.createdAt,
        houseName: lastVisit.houseName,
        contactMethods: [
          lastVisit.contactMethod,
          lastVisit.contactMethod2,
          lastVisit.contactMethod3,
          lastVisit.contactMethod4
        ].filter(Boolean),
        daysSince: Math.ceil((now.getTime() - lastVisit.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      } : null,
      geographicCoverage: {
        totalCities: totalCities.length,
        totalNeighborhoods: totalNeighborhoods.length,
        cities: totalCities.map(c => c.city).filter(Boolean),
        neighborhoods: totalNeighborhoods.map(n => n.neighborhood).filter(Boolean)
      },
      contactMethodStats,
      responseStats
    };

  } catch (error) {
    console.error('Error getting user activity summary:', error);
    return null;
  }
}