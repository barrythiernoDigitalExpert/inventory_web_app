// src/app/api/canvassingvisits/[visitId]/editvisit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

/**
 * POST: Add a user to an existing visit
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
    const { userId, userName } = body

    // Validate input
    if (!userId || !userName) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId and userName are required'
        },
        { status: 400 }
      )
    }

    // Check if visit exists
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: {
          include: {
            user: {
              select: {
                id: true,
                role: true
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

    // Check permissions - only visit members or admins can add users
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can add users'
        },
        { status: 403 }
      )
    }

    // Check if user is already part of the visit
    const existingVisitUser = await prisma.canvassingVisitUser.findUnique({
      where: {
        visitId_userId: {
          visitId: visitId,
          userId: parseInt(userId)
        }
      }
    })

    if (existingVisitUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is already part of this visit'
        },
        { status: 409 }
      )
    }

    // Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, email: true }
    })

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      )
    }

    // Add user to visit
    const visitUser = await prisma.canvassingVisitUser.create({
      data: {
        visitId: visitId,
        userId: parseInt(userId),
        userName: userName || userExists.name || userExists.email || 'Unknown User',
        isCreator: false // Additional users are never creators
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.EDIT_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        addedUserId: parseInt(userId),
        addedUserName: userName,
        houseName: visit.houseName
      },
      context.deviceType,
      processingTime
    )

    console.log(`Added user ${userId} to visit ${visitId} by user ${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        visitUser,
        visit: {
          id: visit.id,
          houseName: visit.houseName
        }
      },
      message: `Successfully added ${userName} to visit`,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/[visitId]/editvisit/POST',
      user?.id,
      context
    )
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add user to visit',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove a user from a visit
 */
export async function DELETE(
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

    // Get user to remove from query params
    const { searchParams } = new URL(request.url)
    const userToRemoveId = parseInt(searchParams.get('userId') || '0')

    if (!userToRemoveId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId query parameter is required'
        },
        { status: 400 }
      )
    }

    // Check if visit exists and get current users
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: {
          include: {
            user: {
              select: {
                id: true,
                role: true
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

    // Check permissions - only admins, visit creators, or the user themselves can remove users
    const isAdmin = user.role === 'ADMIN'
    const isCreator = visit.visitUsers.some(vu => vu.userId === user.id && vu.isCreator)
    const isSelf = user.id === userToRemoveId

    if (!isAdmin && !isCreator && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only admins, visit creators, or the user themselves can remove users'
        },
        { status: 403 }
      )
    }

    // Check if user is part of the visit
    const visitUser = await prisma.canvassingVisitUser.findUnique({
      where: {
        visitId_userId: {
          visitId: visitId,
          userId: userToRemoveId
        }
      }
    })

    if (!visitUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is not part of this visit'
        },
        { status: 404 }
      )
    }

    // Prevent removing the creator if they are the only user
    if (visitUser.isCreator && visit.visitUsers.length === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot remove the creator when they are the only user on the visit'
        },
        { status: 400 }
      )
    }

    // Remove user from visit
    await prisma.canvassingVisitUser.delete({
      where: {
        visitId_userId: {
          visitId: visitId,
          userId: userToRemoveId
        }
      }
    })

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.EDIT_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        removedUserId: userToRemoveId,
        removedUserName: visitUser.userName,
        removedUserIsCreator: visitUser.isCreator,
        houseName: visit.houseName
      },
      context.deviceType,
      processingTime
    )

    console.log(`Removed user ${userToRemoveId} from visit ${visitId} by user ${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        removedUser: {
          id: userToRemoveId,
          userName: visitUser.userName,
          isCreator: visitUser.isCreator
        },
        visit: {
          id: visit.id,
          houseName: visit.houseName
        }
      },
      message: `Successfully removed user from visit`,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/[visitId]/editvisit/DELETE',
      user?.id,
      context
    )
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove user from visit',
        processingTime
      },
      { status: 500 }
    )
  }
}