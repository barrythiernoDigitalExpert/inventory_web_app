// src/app/api/canvassingvisits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { v4 as uuidv4 } from 'uuid'
import { $Enums } from '@prisma/client';

// Define interfaces for better type safety
interface CanvassingVisitData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  contactMethod: string;
  houseName: string;
  vendorName?: string;
  comments?: string;
  streetAddress?: string;
  neighborhood?: string;
  city?: string;
  postalCode?: string;
  imagePath?: string;
  mobileId?: string;
  createdAt?: string;
  responseReceived?: string;
  responseDate?: string;
}

/**
 * GET: Retrieve canvassing visits with filtering
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authentication first (same pattern as upload route)
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const contactMethod = searchParams.get('contactMethod')
    const responseReceived = searchParams.get('responseReceived')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const forMap = searchParams.get('forMap') === 'true'

    console.log(`Fetching canvassing visits for user: ${user.id}`)

    // Build where clause
    const whereClause: any = {}

    // For non-admin users, restrict to their own visits
   

    if (contactMethod) whereClause.contactMethod = contactMethod
    if (responseReceived) whereClause.responseReceived = responseReceived
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    // Get visits from database
    const visits = await prisma.canvassingVisit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: forMap ? {
        id: true,
        latitude: true,
        longitude: true,
        houseName: true,
        contactMethod: true,
        responseReceived: true,
        createdAt: true
      } : undefined
    })

    // Get total count for pagination
    const total = await prisma.canvassingVisit.count({
      where: whereClause
    })

    const processingTime = Date.now() - startTime
    console.log(`Retrieved ${visits.length} visits in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: {
        visits,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
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

/**
 * POST: Create a new canvassing visit or bulk sync visits
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authentication first (same pattern as upload route)
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Get request data
    const body = await request.json()
    
    console.log(`Creating canvassing visit(s) for user: ${user.id}`)
    console.log(`Request body type: ${Array.isArray(body) ? 'array' : 'single'}`)

    // Handle both single visit and bulk sync (like upload route handles images)
    if (Array.isArray(body)) {
      // Bulk sync from mobile app
      console.log(`Processing bulk sync with ${body.length} visits`)
      
      const createdVisits: { id: string; createdAt: Date; updatedAt: Date; city: string | null; postalCode: string | null; imagePath: string | null; userId: number; userName: string; latitude: number; longitude: number; contactMethod: $Enums.ContactMethod; houseName: string; vendorName: string | null; comments: string | null; streetAddress: string | null; neighborhood: string | null; responseReceived: $Enums.ResponseType | null; responseDate: Date | null; isSynced: boolean; mobileId: string | null; syncedAt: Date | null; }[] = [];
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Use transaction for bulk operations (like upload route)
      await prisma.$transaction(async (tx) => {
        for (const visitData of body) {
          try {
            // Validate required fields
            if (!visitData.latitude || !visitData.longitude || !visitData.contactMethod || !visitData.houseName) {
              errors.push(`Invalid visit data: missing required fields`)
              errorCount++
              continue
            }

            // Check for duplicate based on mobileId or coordinates + timestamp
            let existingVisit = null
            if (visitData.mobileId) {
              existingVisit = await tx.canvassingVisit.findFirst({
                where: { mobileId: visitData.mobileId }
              })
            }

            if (existingVisit) {
              console.log(`Visit with mobileId ${visitData.mobileId} already exists, skipping`)
              continue
            }

            const visit = await tx.canvassingVisit.create({
              data: {
                userId: user.id,
                userName: user.name || user.email || 'Unknown User',
                latitude: parseFloat(visitData.latitude),
                longitude: parseFloat(visitData.longitude),
                contactMethod: visitData.contactMethod,
                houseName: visitData.houseName,
                vendorName: visitData.vendorName || null,
                comments: visitData.comments || null,
                streetAddress: visitData.streetAddress || null,
                neighborhood: visitData.neighborhood || null,
                city: visitData.city || null,
                postalCode: visitData.postalCode || null,
                imagePath: visitData.imagePath || null,
                mobileId: visitData.mobileId || uuidv4(),
                createdAt: visitData.createdAt ? new Date(visitData.createdAt) : new Date(),
                responseReceived: visitData.responseReceived || null,
                responseDate: visitData.responseDate ? new Date(visitData.responseDate) : null
              }
            })

            createdVisits.push(visit)
            successCount++
            
          } catch (error) {
            console.error('Error creating individual visit:', error)
            errors.push(`Failed to create visit: ${error instanceof Error ? error.message : 'Unknown error'}`)
            errorCount++
          }
        }
      })

      // Log activity (like upload route)
      if (successCount > 0) {
        await prisma.userActivity.create({
          data: {
            userId: user.id,
            activityType: 'sync_canvassing',
            entityType: 'canvassing_visit',
            details: `Bulk sync: ${successCount} visits created, ${errorCount} errors`,
            deviceType: 'mobile',
            timestamp: new Date()
          }
        })
      }

      const processingTime = Date.now() - startTime
      console.log(`Bulk sync completed in ${processingTime}ms: ${successCount} success, ${errorCount} errors`)

      return NextResponse.json({
        success: successCount > 0,
        data: {
          visits: createdVisits,
          stats: {
            total: body.length,
            successful: successCount,
            errors: errorCount,
            errorMessages: errors
          }
        },
        message: `Bulk sync completed: ${successCount} visits created`,
        processingTime
      }, { status: 201 })

    } else {
      // Single visit creation
      const {
        latitude,
        longitude,
        contactMethod,
        houseName,
        vendorName,
        comments,
        streetAddress,
        neighborhood,
        city,
        postalCode,
        imagePath,
        mobileId,
        createdAt,
        responseReceived,
        responseDate
      } = body

      // Validate required fields (same as upload route validation)
      if (!latitude || !longitude || !contactMethod || !houseName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: latitude, longitude, contactMethod, houseName',
            processingTime: Date.now() - startTime
          },
          { status: 400 }
        )
      }

      console.log(`Creating single visit: ${houseName} at ${latitude}, ${longitude}`)

      // Check for existing visit with same mobileId
      if (mobileId) {
        const existingVisit = await prisma.canvassingVisit.findFirst({
          where: { mobileId }
        })

        if (existingVisit) {
          return NextResponse.json(
            {
              success: false,
              error: 'Visit with this mobile ID already exists',
              processingTime: Date.now() - startTime
            },
            { status: 409 }
          )
        }
      }

      const visitData: any = {
        userId: user.id,
        userName: user.name || user.email || 'Unknown User',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contactMethod,
        houseName,
        vendorName: vendorName || null,
        comments: comments || null,
        streetAddress: streetAddress || null,
        neighborhood: neighborhood || null,
        city: city || null,
        postalCode: postalCode || null,
        imagePath: imagePath || null,
        mobileId: mobileId || uuidv4(),
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        responseReceived: responseReceived || null,
        responseDate: responseDate ? new Date(responseDate) : null
      }

      const visit = await prisma.canvassingVisit.create({
        data: visitData
      })

      // Log activity (like upload route)
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'create_canvassing_visit',
          entityId: parseInt(visit.id) ,
          entityType: 'canvassing_visit',
          details: `Visit created: ${houseName} (${contactMethod})`,
          deviceType: 'mobile',
          timestamp: new Date()
        }
      })

      const processingTime = Date.now() - startTime
      console.log(`Single visit created in ${processingTime}ms: ${visit.id}`)

      return NextResponse.json({
        success: true,
        data: {
          visit,
          message: 'Visit created successfully'
        },
        processingTime
      }, { status: 201 })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Error creating canvassing visit (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create visit',
        processingTime
      },
      { status: 500 }
    )
  }
}