// src/app/api/canvassingvisits/[visitId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { ActivityType, EntityType } from '@prisma/client'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'

interface CommentParams {
  visitId: string
}

/**
 * POST: Add a comment to a canvassing visit
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<CommentParams> }
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
    const { comment, isInitial = false } = body

    console.log(`Adding comment to visit: ${visitId} by user: ${user.id}`)

    // Validate required fields
    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Comment is required',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Check if visit exists
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: true,
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
          orderBy: { createdAt: 'desc' }
        }
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

    // Check if user can add comments (visit members or admins)
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can add comments',
          processingTime: Date.now() - startTime
        },
        { status: 403 }
      )
    }

    // If marking as initial comment, check if there's already an initial comment
    if (isInitial) {
      const existingInitialComment = visit.additionalComments.find(c => c.isInitial)
      if (existingInitialComment) {
        return NextResponse.json(
          {
            success: false,
            error: 'An initial comment already exists for this visit',
            processingTime: Date.now() - startTime
          },
          { status: 400 }
        )
      }
    }

    // Create the comment
    const newComment = await prisma.canvassingVisitComment.create({
      data: {
        visitId,
        userId: user.id,
        comment: comment.trim(),
        isInitial
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

    // Log activity
    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.EDIT_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        action: 'add_comment',
        commentType: isInitial ? 'initial' : 'secondary',
        commentLength: comment.trim().length
      },
      context.deviceType,
      processingTime
    )

    console.log(`Comment added to visit ${visitId} in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        comment: newComment
      },
      message: 'Comment added successfully',
      processingTime
    }, { status: 201 })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/comments/POST',
      user?.id,
      context
    )
    console.error(`Error adding comment (${processingTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Get all comments for a canvassing visit
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<CommentParams> }
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

    console.log(`Getting comments for visit: ${visitId} by user: ${user.id}`)

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

    // Check if user can view comments (visit members or admins)
    const isVisitMember = visit.visitUsers.some(vu => vu.userId === user.id)
    const isAdmin = user.role === 'ADMIN'

    if (!isVisitMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only visit members or admins can view comments',
          processingTime: Date.now() - startTime
        },
        { status: 403 }
      )
    }

    // Get all comments for the visit
    const comments = await prisma.canvassingVisitComment.findMany({
      where: { visitId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Separate initial comment from secondary comments
    const initialComment = comments.find(c => c.isInitial)
    const secondaryComments = comments.filter(c => !c.isInitial)

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        action: 'view_comments',
        commentCount: comments.length
      },
      context.deviceType,
      processingTime
    )

    console.log(`Retrieved ${comments.length} comments in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        visit: {
          id: visit.id,
          houseName: visit.houseName,
          comments: visit.comments // Original visit comment
        },
        initialComment,
        secondaryComments,
        totalComments: comments.length
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/comments/GET',
      user?.id,
      context
    )
    console.error(`Error getting comments (${processingTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comments',
        processingTime
      },
      { status: 500 }
    )
  }
}