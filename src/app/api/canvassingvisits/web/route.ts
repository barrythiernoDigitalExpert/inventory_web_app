// src/app/api/canvassingvisits/web/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/utils/auth'
import { ActivityType, EntityType, UserRole } from '@prisma/client'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * GET: Retrieve canvassing visits for web interface using NextAuth session
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication using NextAuth session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Please login' 
      }, { status: 401 })
    }

    // Get user from database
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ 
        success: false,
        error: 'Account inactive' 
      }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contactMethod = searchParams.get('contactMethod')
    const responseReceived = searchParams.get('responseReceived')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10000')
    const offset = parseInt(searchParams.get('offset') || '0')
    const forMap = searchParams.get('forMap') === 'true'

    console.log(`Fetching canvassing visits for user: ${user.id}`)

    // Build where clause
    const whereClause: any = {}

    // For non-admin users, restrict to their own visits unless they specify a user
    if (user.role !== UserRole.ADMIN && !userId) {
      const userVisitIds = await prisma.canvassingVisitUser.findMany({
        where: { userId: user.id },
        select: { visitId: true }
      })
      console.log(`Non-admin user ${user.id} has ${userVisitIds.length} visits`)
      whereClause.id = {
        in: userVisitIds.map(uv => uv.visitId)
      }
    } else if (userId) {
      // Filter by specific user if requested
      console.log(`Filtering by user ID: ${userId}`)
      const userVisitIds = await prisma.canvassingVisitUser.findMany({
        where: { userId: parseInt(userId) },
        select: { visitId: true }
      })
      console.log(`User ${userId} has ${userVisitIds.length} visits`)
      whereClause.id = {
        in: userVisitIds.map(uv => uv.visitId)
      }
    }

    console.log('Final whereClause:', whereClause);

    if (contactMethod) whereClause.contactMethod = contactMethod
    if (responseReceived) whereClause.responseReceived = responseReceived
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    // Get visit configuration for revisit logic
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168 // Default 1 week

    // Get visits from database with enriched data
    const visits = forMap 
      ? await prisma.canvassingVisit.findMany({
          where: whereClause,
          select: {
            id: true,
            latitude: true,
            longitude: true,
            houseName: true,
            contactMethod: true,
            responseReceived: true,
            createdAt: true,
            comments: true,
            imagePath: true,
            streetAddress: true,
            neighborhood: true,
            city: true,
            vendorName: true,
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
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
      : await prisma.canvassingVisit.findMany({
          where: whereClause,
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
                    email: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })

    // Get total count for pagination
    const total = await prisma.canvassingVisit.count({
      where: whereClause
    })

    // Add revisit information and format user data for non-map requests
    const enrichedVisits = forMap ? visits : await Promise.all(visits.map(async (visit: any) => {
      const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
      const canRevisit = (visit.responseReceived === 'pending' || visit.responseReceived === 'no_response' || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours
      
      // Format revisits information from the Revisit table
      const revisits = visit.revisits?.map((revisit: any) => ({
        id: revisit.id,
        latitude: revisit.latitude,
        longitude: revisit.longitude,
        contactMethods: [
          revisit.contactMethod1,
          revisit.contactMethod2,
          revisit.contactMethod3,
          revisit.contactMethod4
        ].filter(Boolean),
        houseName: revisit.houseName,
        vendorName: revisit.vendorName,
        comments: revisit.comments,
        streetAddress: revisit.streetAddress,
        neighborhood: revisit.neighborhood,
        city: revisit.city,
        postalCode: revisit.postalCode,
        imagePath: revisit.imagePath,
        responseReceived: revisit.responseReceived,
        responseDate: revisit.responseDate,
        createdAt: revisit.createdAt,
        user: {
          id: revisit.user.id,
          name: revisit.user.name,
          email: revisit.user.email
        },
        hoursSinceOriginal: Math.round((revisit.createdAt.getTime() - visit.createdAt.getTime()) / (1000 * 60 * 60))
      })) || []

      return {
        ...visit,
        userNames: visit.visitUsers?.length > 0 ? visit.visitUsers.map((vu: any) => vu.userName).join(', ') : '',
        users: visit.visitUsers?.length > 0 ? visit.visitUsers.map((vu: any) => ({
          id: vu.user.id,
          name: vu.user.name,
          email: vu.user.email,
          isCreator: vu.isCreator,
          joinedAt: vu.joinedAt
        })) : [],
        contactMethods: [
          visit.contactMethod,
          visit.contactMethod2,
          visit.contactMethod3,
          visit.contactMethod4
        ].filter(Boolean),
        canRevisit,
        hoursSinceVisit: Math.round(hoursSinceVisit),
        hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit),
        // Revisit information
        revisits: revisits.length > 0 ? revisits : undefined,
        hasRevisits: revisits.length > 0,
        revisitCount: revisits.length
      }
    }))

    const processingTime = Date.now() - startTime
    console.log(`Retrieved ${visits.length} visits in ${processingTime}ms`)

    // Log the view activity
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.CANVASSING_VISIT,
      undefined,
      {
        resultCount: visits.length,
        totalAvailable: total,
        filters: { userId, contactMethod, responseReceived, startDate, endDate },
        userRole: user.role,
        forMap
      },
      context.deviceType,
      processingTime
    )

    return NextResponse.json({
      success: true,
      data: {
        visits: enrichedVisits,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        visitConfig: forMap ? undefined : {
          revisitDelayHours
        }
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/web/GET',
      user?.id,
      context
    )
    console.error(`Error fetching canvassing visits (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch visits',
        processingTime
      },
      { status: 500 }
    )
  }
}