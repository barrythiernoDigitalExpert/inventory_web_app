// src/app/api/canvassingvisits/[visitId]/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ActivityType, EntityType } from '@/generated/prisma'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

interface ImageParams {
  visitId: string
}

/**
 * PUT: Update the image for a canvassing visit
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<ImageParams> }
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
    const { visitId } = params

    const body = await request.json()
    const { imagePath } = body

    console.log(`Updating image for visit: ${visitId} by user: ${user.id}`)

    // Check if visit exists
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: true
      }
    })

    if (!visit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Visit not found',
          processingTime: Date.now() - startTime
        },
        { status: 404 }
      )
    }

    // Check if user can update the visit (visit members or admins)
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can update images',
          processingTime: Date.now() - startTime
        },
        { status: 403 }
      )
    }

    // Store old image path for logging
    const oldImagePath = visit.imagePath

    // Update the visit image
    const updatedVisit = await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: {
        imagePath: imagePath || null,
        updatedAt: new Date()
      },
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
          }
        }
      }
    })

    // Log activity
    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.EDIT_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        action: 'update_image',
        hadOldImage: !!oldImagePath,
        hasNewImage: !!imagePath,
        houseName: visit.houseName
      },
      context.deviceType,
      processingTime
    )

    console.log(`Visit image updated in ${processingTime}ms: ${visitId}`)

    return NextResponse.json({
      success: true,
      data: {
        visit: {
          ...updatedVisit,
          userNames: updatedVisit.visitUsers.map(vu => vu.userName).join(', '),
          users: updatedVisit.visitUsers.map(vu => ({
            id: vu.user.id,
            name: vu.user.name,
            email: vu.user.email,
            isCreator: vu.isCreator,
            joinedAt: vu.joinedAt
          }))
        }
      },
      message: imagePath ? 'Image updated successfully' : 'Image removed successfully',
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/image/PUT',
      user?.id,
      context
    )
    console.error(`Error updating visit image (${processingTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update image',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove the image from a canvassing visit
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<ImageParams> }
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
    const { visitId } = params

    console.log(`Removing image from visit: ${visitId} by user: ${user.id}`)

    // Check if visit exists
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: true
      }
    })

    if (!visit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Visit not found',
          processingTime: Date.now() - startTime
        },
        { status: 404 }
      )
    }

    // Check if user can update the visit (visit members or admins)
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can remove images',
          processingTime: Date.now() - startTime
        },
        { status: 403 }
      )
    }

    // Check if there's an image to remove
    if (!visit.imagePath) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image to remove',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Store old image path for logging
    const oldImagePath = visit.imagePath

    // Remove the image
    const updatedVisit = await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: {
        imagePath: null,
        updatedAt: new Date()
      },
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
          }
        }
      }
    })

    // Log activity
    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.EDIT_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        action: 'remove_image',
        removedImagePath: oldImagePath,
        houseName: visit.houseName
      },
      context.deviceType,
      processingTime
    )

    console.log(`Visit image removed in ${processingTime}ms: ${visitId}`)

    return NextResponse.json({
      success: true,
      data: {
        visit: {
          ...updatedVisit,
          userNames: updatedVisit.visitUsers.map(vu => vu.userName).join(', '),
          users: updatedVisit.visitUsers.map(vu => ({
            id: vu.user.id,
            name: vu.user.name,
            email: vu.user.email,
            isCreator: vu.isCreator,
            joinedAt: vu.joinedAt
          }))
        }
      },
      message: 'Image removed successfully',
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/image/DELETE',
      user?.id,
      context
    )
    console.error(`Error removing visit image (${processingTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove image',
        processingTime
      },
      { status: 500 }
    )
  }
}