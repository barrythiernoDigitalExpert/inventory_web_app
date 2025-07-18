// src/app/api/canvassingvisits/[visitId]/revisit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { v4 as uuidv4 } from 'uuid'
import { ActivityType, EntityType } from '@prisma/client'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * POST: Create a revisit for an existing visit
 */
export async function POST(
  request: NextRequest,
 props: { params: Promise<{ visitId: string }> }
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
      const params = await props.params;
        const visitId = (params.visitId);

    // Get request data
    const body = await request.json()
    const { 
      revisitReason, 
      comments, 
      additionalUsers, 
      contactMethod, 
      vendorName 
    } = body

    // Get the original visit
    const originalVisit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!originalVisit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Original visit not found'
        },
        { status: 404 }
      )
    }

    // Check if user can create revisits (must be part of original visit or admin)
    const isVisitMember = originalVisit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can create revisits'
        },
        { status: 403 }
      )
    }

    // Check visit configuration for revisit eligibility
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168 // Default 1 week
    const hoursSinceVisit = (Date.now() - originalVisit.createdAt.getTime()) / (1000 * 60 * 60)
    
    // Only allow revisits for visits that are not positive or negative
    if (originalVisit.responseReceived === 'positive' || originalVisit.responseReceived === 'negative') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot revisit visits with positive or negative response status'
        },
        { status: 400 }
      )
    }

    if (hoursSinceVisit < revisitDelayHours) {
      const hoursRemaining = Math.round(revisitDelayHours - hoursSinceVisit)
      return NextResponse.json(
        {
          success: false,
          error: `Cannot revisit yet. ${hoursRemaining} hours remaining before revisit is allowed.`,
          data: {
            hoursRemaining,
            hoursSinceVisit: Math.round(hoursSinceVisit),
            requiredDelayHours: revisitDelayHours
          }
        },
        { status: 400 }
      )
    }

    // Create the revisit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new visit (revisit)
      const newVisit = await tx.canvassingVisit.create({
        data: {
          latitude: originalVisit.latitude,
          longitude: originalVisit.longitude,
          contactMethod: contactMethod || originalVisit.contactMethod,
          houseName: originalVisit.houseName,
          vendorName: vendorName || originalVisit.vendorName,
          comments: comments || `Revisit: ${revisitReason || 'Follow-up visit'}`,
          streetAddress: originalVisit.streetAddress,
          neighborhood: originalVisit.neighborhood,
          city: originalVisit.city,
          postalCode: originalVisit.postalCode,
          mobileId: uuidv4(),
          responseReceived: 'pending', // Always start as pending
          isSynced: true,
          syncedAt: new Date()
        }
      })

      // Add creator to revisit
      await tx.canvassingVisitUser.create({
        data: {
          visitId: newVisit.id,
          userId: user.id,
          userName: user.name || user.email || 'Unknown User',
          isCreator: true
        }
      })

      // Add additional users if provided
      if (additionalUsers && additionalUsers.length > 0) {
        for (const additionalUser of additionalUsers) {
          await tx.canvassingVisitUser.create({
            data: {
              visitId: newVisit.id,
              userId: additionalUser.userId,
              userName: additionalUser.userName,
              isCreator: false
            }
          })
        }
      }

      // Create revisit tracking record
      await tx.visitRevisit.create({
        data: {
          originalVisitId: visitId,
          newVisitId: newVisit.id,
          revisitReason: revisitReason || 'Follow-up visit'
        }
      })

      // Return the complete revisit data
      return await tx.canvassingVisit.findUnique({
        where: { id: newVisit.id },
        include: {
          visitUsers: {
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
              joinedAt: 'asc'
            }
          }
        }
      })
    })

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT,
      EntityType.CANVASSING_VISIT,
      result!.id,
      {
        action: 'create_revisit',
        originalVisitId: visitId,
        newVisitId: result!.id,
        revisitReason: revisitReason || 'Follow-up visit',
        hoursSinceOriginal: Math.round(hoursSinceVisit),
        additionalUsersCount: additionalUsers?.length || 0
      },
      context.deviceType,
      processingTime
    )

    console.log(`Created revisit ${result!.id} for original visit ${visitId} by user ${user.id}`)

    // Use the already fetched visitConfig and revisitDelayHours

    // Add revisit information to match POST format
    const hoursSinceCreation = (Date.now() - result!.createdAt.getTime()) / (1000 * 60 * 60)
    const canRevisit = (result!.responseReceived === 'pending' || result!.responseReceived === 'no_response' || result!.responseReceived === null) && hoursSinceCreation >= revisitDelayHours

    // Format the result to match POST visit format
    const enrichedResult = {
      ...result,
      userNames: result!.visitUsers.map((vu: any) => vu.userName).join(', '),
      users: result!.visitUsers.map((vu: any) => ({
        id: vu.user.id,
        name: vu.user.name,
        email: vu.user.email,
        isCreator: vu.isCreator,
        joinedAt: vu.joinedAt
      })),
      canRevisit,
      hoursSinceVisit: Math.round(hoursSinceCreation),
      hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceCreation),
      originalVisit: {
        id: originalVisit.id,
        houseName: originalVisit.houseName,
        responseReceived: originalVisit.responseReceived,
        createdAt: originalVisit.createdAt
      },
      revisitInfo: {
        hoursSinceOriginal: Math.round(hoursSinceVisit),
        revisitReason: revisitReason || 'Follow-up visit'
      },
      isRevisit: true
    }

    return NextResponse.json({
      success: true,
      data: {
        visits: [enrichedResult],
        pagination: {
          total: 1,
          limit: 1,
          offset: 0,
          hasMore: false
        },
        visitConfig: {
          revisitDelayHours
        }
      },
      message: 'Revisit created successfully',
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/[visitId]/revisit/POST',
      user?.id,
      context
    )
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create revisit',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Get revisit information for a visit
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ visitId: string }> }
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
      const params = await props.params;
        const visitId = (params.visitId);

    // Get visit and its revisit information
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        originalRevisits: {
          include: {
            newVisit: {
              include: {
                visitUsers: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        revisitOf: {
          include: {
            originalVisit: {
              include: {
                visitUsers: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!visit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Visit not found'
        },
        { status: 404 }
      )
    }

    // Check if user can view revisit info (must be part of visit or admin)
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can view revisit information'
        },
        { status: 403 }
      )
    }

    // Get visit configuration for revisit eligibility
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168
    const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
    const canRevisit = visit.responseReceived === 'pending' && hoursSinceVisit >= revisitDelayHours

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        visit,
        revisitInfo: {
          canRevisit,
          hoursSinceVisit: Math.round(hoursSinceVisit),
          hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit),
          revisitDelayHours,
          isEligibleForRevisit: visit.responseReceived === 'pending'
        },
        revisits: visit.originalRevisits, // Visits that were created as revisits of this one
        isRevisitOf: visit.revisitOf.length > 0 ? visit.revisitOf[0] : null // Original visit if this is a revisit
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/[visitId]/revisit/GET',
      user?.id,
      context
    )
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get revisit information',
        processingTime
      },
      { status: 500 }
    )
  }
}