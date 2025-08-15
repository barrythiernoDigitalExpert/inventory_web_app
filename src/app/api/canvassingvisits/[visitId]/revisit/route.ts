// src/app/api/canvassingvisits/[visitId]/revisit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { v4 as uuidv4 } from 'uuid'
import { ContactMethod, ResponseType, ActivityType, EntityType } from '@prisma/client'
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
      latitude,
      longitude,
      contactMethod1,
      contactMethod2,
      contactMethod3,
      contactMethod4,
      houseName,
      vendorName,
      comments,
      streetAddress,
      neighborhood,
      city,
      postalCode,
      imagePath,
      responseReceived,
      responseDate
    } = body

    console.log(`Creating revisit for visit: ${visitId} by user: ${user.id}`)

    // Get the original visit
    const originalVisit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: true,
        revisits: true
      }
    })

    if (!originalVisit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Original visit not found',
          processingTime: Date.now() - startTime
        },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!latitude || !longitude || !contactMethod1 || !houseName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: latitude, longitude, contactMethod1, houseName',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Check visit configuration for revisit delay
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168 // Default 1 week

    const hoursSinceOriginal = (Date.now() - originalVisit.createdAt.getTime()) / (1000 * 60 * 60)
    
    // Allow admins to bypass delay check
    if (user.role !== 'ADMIN' && hoursSinceOriginal < revisitDelayHours) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot create revisit yet. Please wait ${Math.ceil(revisitDelayHours - hoursSinceOriginal)} more hours.`,
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Collect new contact methods from revisit
    const newContactMethods = [contactMethod1, contactMethod2, contactMethod3, contactMethod4]
      .filter(Boolean) as ContactMethod[]

    // Get existing contact methods from original visit
    const existingContactMethods = [
      originalVisit.contactMethod,
      originalVisit.contactMethod2,
      originalVisit.contactMethod3,
      originalVisit.contactMethod4
    ].filter(Boolean) as ContactMethod[]

    // Merge contact methods without duplicates
    const mergedContactMethods = [...new Set([...existingContactMethods, ...newContactMethods])]

    // Prepare update data for original visit
    const updateData: any = {
      contactMethod: mergedContactMethods[0] || originalVisit.contactMethod,
      contactMethod2: mergedContactMethods[1] || null,
      contactMethod3: mergedContactMethods[2] || null,
      contactMethod4: mergedContactMethods[3] || null
    }

    // Update response status if it's a definitive response (not no_response, pending, or null)
    if (responseReceived && 
        responseReceived !== 'no_response' && 
        responseReceived !== 'pending' && 
        responseReceived !== 'NO Response') {
      updateData.responseReceived = responseReceived as ResponseType
      if (responseDate) {
        updateData.responseDate = new Date(responseDate)
      }
    }

    // Update original visit with merged contact methods and response status
    await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: updateData
    })

    // Create the revisit using the new Revisit model
    const revisit = await prisma.revisit.create({
      data: {
        originalVisitId: visitId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contactMethod1: contactMethod1 as ContactMethod,
        contactMethod2: contactMethod2 as ContactMethod || null,
        contactMethod3: contactMethod3 as ContactMethod || null,
        contactMethod4: contactMethod4 as ContactMethod || null,
        houseName,
        vendorName: vendorName || null,
        comments: comments || null,
        streetAddress: streetAddress || null,
        neighborhood: neighborhood || null,
        city: city || null,
        postalCode: postalCode || null,
        imagePath: imagePath || null,
        responseReceived: responseReceived as ResponseType || null,
        responseDate: responseDate ? new Date(responseDate) : null,
        userId: user.id,
        userName: user.name || user.email || 'Unknown User'
      }
    })

    // Get the enriched revisit data
    const enrichedRevisit = await prisma.revisit.findUnique({
      where: { id: revisit.id },
      include: {
        originalVisit: {
          select: {
            id: true,
            houseName: true,
            contactMethod: true,
            responseReceived: true,
            createdAt: true,
            visitUsers: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Log activity
    const processingTime = Date.now() - startTime
    await loggingService.logActivity(
      user.id,
      ActivityType.CANVASSING_VISIT,
      EntityType.CANVASSING_VISIT,
      revisit.id,
      {
        type: 'revisit',
        originalVisitId: visitId,
        houseName,
        contactMethods: [contactMethod1, contactMethod2, contactMethod3, contactMethod4].filter(Boolean),
        hasLocation: !!(latitude && longitude),
        hasImage: !!imagePath,
        hasVendor: !!vendorName,
        hoursSinceOriginal: Math.round(hoursSinceOriginal)
      },
      context.deviceType,
      processingTime
    )

    console.log(`Revisit created in ${processingTime}ms: ${revisit.id}`)

    return NextResponse.json({
      success: true,
      data: {
        revisit: {
          ...enrichedRevisit,
          contactMethods: [
            enrichedRevisit?.contactMethod1,
            enrichedRevisit?.contactMethod2,
            enrichedRevisit?.contactMethod3,
            enrichedRevisit?.contactMethod4
          ].filter(Boolean),
          hoursSinceOriginal: Math.round(hoursSinceOriginal),
          visitConfig: {
            revisitDelayHours
          }
        }
      },
      message: 'Revisit created successfully',
      processingTime
    }, { status: 201 })

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
 * GET: Get all revisits for a specific visit
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
    const params = await props.params
    const visitId = params.visitId

    console.log(`Getting revisits for visit: ${visitId} by user: ${user.id}`)

    // Check if original visit exists
    const originalVisit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId }
    })

    if (!originalVisit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Visit not found',
          processingTime: Date.now() - startTime
        },
        { status: 404 }
      )
    }

    // Get all revisits for this visit
    const revisits = await prisma.revisit.findMany({
      where: { originalVisitId: visitId },
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
      orderBy: { createdAt: 'desc' }
    })

    // Get visit configuration
    const visitConfig = await prisma.visitConfiguration.findFirst({
      where: { isActive: true },
      select: { revisitDelayHours: true }
    })
    const revisitDelayHours = visitConfig?.revisitDelayHours || 168

    // Add computed fields
    const enrichedRevisits = revisits.map(revisit => {
      const hoursSinceOriginal = (revisit.createdAt.getTime() - originalVisit.createdAt.getTime()) / (1000 * 60 * 60)
      
      return {
        ...revisit,
        contactMethods: [
          revisit.contactMethod1,
          revisit.contactMethod2,
          revisit.contactMethod3,
          revisit.contactMethod4
        ].filter(Boolean),
        hoursSinceOriginal: Math.round(hoursSinceOriginal)
      }
    })

    const processingTime = Date.now() - startTime

    // Log activity
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.CANVASSING_VISIT,
      visitId,
      {
        type: 'view_revisits',
        revisitCount: revisits.length
      },
      context.deviceType,
      processingTime
    )

    console.log(`Retrieved ${revisits.length} revisits in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        revisits: enrichedRevisits,
        originalVisit: {
          id: originalVisit.id,
          houseName: originalVisit.houseName,
          createdAt: originalVisit.createdAt
        },
        visitConfig: {
          revisitDelayHours
        },
        totalCount: revisits.length
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/revisit/GET',
      user?.id,
      context
    )
    console.error(`Error getting revisits (${processingTime}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get revisits',
        processingTime
      },
      { status: 500 }
    )
  }
}