// src/app/api/canvassingvisits/with-revisits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * GET: Retrieve canvassing visits with their associated revisits
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contactMethod = searchParams.get('contactMethod')
    const responseReceived = searchParams.get('responseReceived')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userSpecific = searchParams.get('userSpecific') === 'true'

    console.log(`Fetching visits with revisits for user: ${user.id}, userSpecific: ${userSpecific}`)

    // Build where clause for visits
    let visitWhereClause: any = {}

    if (user.role !== 'ADMIN') {
      // Non-admin: always restricted to their own visits regardless of userSpecific flag
      visitWhereClause.visitUsers = { some: { userId: user.id } }
    } else if (userId) {
      // Admin filtering by specific user
      visitWhereClause.visitUsers = { some: { userId: parseInt(userId) } }
    } else if (userSpecific) {
      // Admin with userSpecific=true: filter by own visits
      visitWhereClause.visitUsers = { some: { userId: user.id } }
    }

    // Add other filters
    if (contactMethod) visitWhereClause.contactMethod = contactMethod
    if (responseReceived) visitWhereClause.responseReceived = responseReceived
    if (startDate || endDate) {
      visitWhereClause.createdAt = {}
      if (startDate) visitWhereClause.createdAt.gte = new Date(startDate)
      if (endDate) visitWhereClause.createdAt.lte = new Date(endDate)
    }

    // Get visits with their revisits
    const visits = await prisma.canvassingVisit.findMany({
      where: visitWhereClause,
      include: {
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
            joinedAt: 'asc'
          }
        },
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
            createdAt: 'desc'
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
            createdAt: 'asc'
          }
        }
      },
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

    // Enrich visits with computed fields
    const enrichedVisits = visits.map(visit => {
      const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
      const canRevisit = (visit.responseReceived === 'pending' || visit.responseReceived === 'no_response' || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours

      // Format revisits with contact methods array
      const enrichedRevisits = visit.revisits.map(revisit => ({
        ...revisit,
        contactMethods: [
          revisit.contactMethod1,
          revisit.contactMethod2,
          revisit.contactMethod3,
          revisit.contactMethod4
        ].filter(Boolean),
        hoursSinceOriginal: Math.round((revisit.createdAt.getTime() - visit.createdAt.getTime()) / (1000 * 60 * 60))
      }))

      return {
        ...visit,
        userNames: visit.visitUsers.map(vu => vu.userName).join(', '),
        users: visit.visitUsers.map(vu => ({
          id: vu.user.id,
          name: vu.user.name,
          email: vu.user.email,
          isCreator: vu.isCreator,
          joinedAt: vu.joinedAt
        })),
        canRevisit,
        hoursSinceVisit: Math.round(hoursSinceVisit),
        hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit),
        revisitsCount: visit.revisits.length,
        revisits: enrichedRevisits,
        commentsCount: visit.additionalComments.length + (visit.comments ? 1 : 0), // Original comment + additional comments
        initialComment: visit.comments,
        additionalComments: visit.additionalComments
      }
    })

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.CANVASSING_VISIT,
      undefined,
      {
        resultCount: visits.length,
        totalAvailable: totalCount,
        filters: { userId, contactMethod, responseReceived, startDate, endDate, userSpecific },
        userRole: user.role,
        includeRevisits: true
      },
      context.deviceType,
      processingTime
    )

    console.log(`Retrieved ${visits.length} visits with revisits in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        visits: enrichedVisits,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        visitConfig: {
          revisitDelayHours
        },
        summary: {
          totalVisits: totalCount,
          totalRevisits: enrichedVisits.reduce((sum, visit) => sum + visit.revisitsCount, 0),
          visitsWithRevisits: enrichedVisits.filter(visit => visit.revisitsCount > 0).length
        }
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/with-revisits/GET',
      user?.id,
      context
    )
    console.error(`Error fetching visits with revisits (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch visits with revisits',
        processingTime
      },
      { status: 500 }
    )
  }
}