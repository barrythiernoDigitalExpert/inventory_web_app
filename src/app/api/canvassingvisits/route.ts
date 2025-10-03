// src/app/api/canvassingvisits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'
import { v4 as uuidv4 } from 'uuid'
import { $Enums, ActivityType, EntityType } from '@prisma/client'
import { loggingService } from '@/lib/services/loggingService'
import { extractRequestContext } from '@/lib/utils/requestHelpers'
import { saveCanvassingImage } from '@/lib/utils/fileStorage'

// Define interfaces for better type safety
interface CanvassingVisitData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  contactMethod: string;
  contactMethod2?: string;
  contactMethod3?: string;
  contactMethod4?: string;
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
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication first (same pattern as upload route)
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
    const limit = parseInt(searchParams.get('limit') || '10000')
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
            createdAt: true
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
        userRole: user.role
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
      'canvassingvisits/GET',
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

/**
 * POST: Create a new canvassing visit or bulk sync visits
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const context = extractRequestContext(request)
  let user: any = null
  
  try {
    // Verify authentication first (same pattern as upload route)
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    user = authResult.user

    // Detect content type and parse accordingly
    const contentType = request.headers.get('content-type') || ''
    let body: any
    let isMultipart = false
    let imageFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart/form-data (file upload)
      isMultipart = true
      const formData = await request.formData()
      
      // Extract image file
      imageFile = formData.get('image') as File | null
      
      // Build body object from form data
      body = {
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        contactMethod: formData.get('contactMethod'),
        contactMethod2: formData.get('contactMethod2'),
        contactMethod3: formData.get('contactMethod3'),
        contactMethod4: formData.get('contactMethod4'),
        houseName: formData.get('houseName'),
        vendorName: formData.get('vendorName'),
        comments: formData.get('comments'),
        streetAddress: formData.get('streetAddress'),
        neighborhood: formData.get('neighborhood'),
        city: formData.get('city'),
        postalCode: formData.get('postalCode'),
        mobileId: formData.get('mobileId'),
        createdAt: formData.get('createdAt'),
        responseReceived: formData.get('responseReceived'),
        responseDate: formData.get('responseDate')
      }
    } else {
      // Handle application/json (original behavior)
      body = await request.json()
    }
    
    console.log(`Creating canvassing visit(s) for user: ${user.id}`)
    console.log(`Request body type: ${Array.isArray(body) ? 'array' : 'single'}`)

    // Handle both single visit and bulk sync (like upload route handles images)
    if (Array.isArray(body)) {
      // Bulk sync from mobile app
      console.log(`Processing bulk sync with ${body.length} visits`)
      
      const createdVisits: any[] = [];
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

            // Handle image upload before creating the visit
            let finalImagePath = null;
            if (visitData.imagePath && visitData.imagePath.startsWith('data:')) {
              try {
                console.log(`Uploading image for bulk visit`);
                const tempVisitId = visitData.mobileId || uuidv4();
                finalImagePath = await saveCanvassingImage(visitData.imagePath, tempVisitId);
                console.log(`Bulk image uploaded successfully: ${finalImagePath}`);
              } catch (imageError) {
                console.error('Error uploading bulk canvassing image:', imageError);
                // Continue with visit creation even if image upload fails
              }
            } else if (visitData.imagePath) {
              // If imagePath is provided but not base64, use it directly (URL)
              finalImagePath = visitData.imagePath;
            }

            // Create visit with the image path
            const visit = await tx.canvassingVisit.create({
              data: {
                latitude: parseFloat(visitData.latitude),
                longitude: parseFloat(visitData.longitude),
                contactMethod: visitData.contactMethod,
                contactMethod2: visitData.contactMethod2 || null,
                contactMethod3: visitData.contactMethod3 || null,
                contactMethod4: visitData.contactMethod4 || null,
                houseName: visitData.houseName,
                vendorName: visitData.vendorName || null,
                comments: visitData.comments || null,
                streetAddress: visitData.streetAddress || null,
                neighborhood: visitData.neighborhood || null,
                city: visitData.city || null,
                postalCode: visitData.postalCode || null,
                imagePath: finalImagePath,
                mobileId: visitData.mobileId || uuidv4(),
                createdAt: visitData.createdAt ? new Date(visitData.createdAt) : new Date(),
                responseReceived: visitData.responseReceived || null,
                responseDate: visitData.responseDate ? new Date(visitData.responseDate) : null
              }
            })

            // Create the visit user relationship
            await tx.canvassingVisitUser.create({
              data: {
                visitId: visit.id,
                userId: user.id,
                userName: user.name || user.email || 'Unknown User',
                isCreator: true
              }
            })

            // Get the enriched visit data with user information
            const enrichedVisit = await tx.canvassingVisit.findUnique({
              where: { id: visit.id },
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
                originalRevisits: {
                  include: {
                    newVisit: {
                      select: {
                        id: true,
                        houseName: true,
                        responseReceived: true,
                        createdAt: true
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
                      select: {
                        id: true,
                        houseName: true,
                        responseReceived: true,
                        createdAt: true
                      }
                    }
                  }
                }
              }
            })

            if (enrichedVisit) {
              createdVisits.push(enrichedVisit)
            }
            successCount++
            
          } catch (error) {
            console.error('Error creating individual visit:', error)
            errors.push(`Failed to create visit: ${error instanceof Error ? error.message : 'Unknown error'}`)
            errorCount++
          }
        }
      })

      // Log activity using logging service
      if (successCount > 0) {
        const processingTime = Date.now() - startTime
        await loggingService.logActivity(
          user.id,
          ActivityType.SYNC_DATA,
          EntityType.CANVASSING_VISIT,
          undefined,
          {
            totalRequested: body.length,
            successfulCreated: successCount,
            errorCount,
            errorMessages: errors.length > 0 ? errors.slice(0, 5) : undefined
          },
          context.deviceType,
          processingTime
        )
      }

      // Get visit configuration for revisit logic
      const visitConfig = await prisma.visitConfiguration.findFirst({
        where: { isActive: true },
        select: { revisitDelayHours: true }
      })
      const revisitDelayHours = visitConfig?.revisitDelayHours || 168

      // Add revisit information to created visits
      const enrichedCreatedVisits = await Promise.all(createdVisits.map(async (visit: any) => {
        const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
        const canRevisit = (visit.responseReceived === 'pending' || visit.responseReceived === 'no_response' || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours
        
        
        // Format revisit information
        const originalVisit = visit.revisitOf.length > 0 ? {
          id: visit.revisitOf[0].originalVisit.id,
          houseName: visit.revisitOf[0].originalVisit.houseName,
          responseReceived: visit.revisitOf[0].originalVisit.responseReceived,
          createdAt: visit.revisitOf[0].originalVisit.createdAt
        } : null

        const revisitInfo = visit.revisitOf.length > 0 ? {
          hoursSinceOriginal: Math.round((visit.createdAt.getTime() - visit.revisitOf[0].originalVisit.createdAt.getTime()) / (1000 * 60 * 60)),
          revisitReason: visit.revisitOf[0].revisitReason || 'Follow-up visit'
        } : null

        const revisits = visit.originalRevisits.map((revisit: any) => ({
          id: revisit.id,
          newVisitId: revisit.newVisit.id,
          revisitReason: revisit.revisitReason,
          createdAt: revisit.createdAt,
          newVisit: {
            id: revisit.newVisit.id,
            houseName: revisit.newVisit.houseName,
            responseReceived: revisit.newVisit.responseReceived,
            createdAt: revisit.newVisit.createdAt
          }
        }))

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
          originalVisit,
          revisitInfo,
          revisits: revisits.length > 0 ? revisits : undefined,
          isRevisit: originalVisit !== null
        }
      }))

      const processingTime = Date.now() - startTime
      console.log(`Bulk sync completed in ${processingTime}ms: ${successCount} success, ${errorCount} errors`)

      return NextResponse.json({
        success: successCount > 0,
        data: {
          visits: enrichedCreatedVisits,
          stats: {
            total: body.length,
            successful: successCount,
            errors: errorCount,
            errorMessages: errors
          },
          visitConfig: {
            revisitDelayHours
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

      // Helper function to normalize contact method
      const normalizeContactMethod = (method: string) => {
        if (method && method.toLowerCase() === 'maildrop') {
          return 'BROCHURE';
        }
        return method;
      };

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

      // Handle image upload before creating the visit
      let finalImagePath = null;
      
      if (isMultipart && imageFile) {
        // Handle file upload from multipart/form-data
        try {
          console.log(`Processing uploaded image file: ${imageFile.name}, size: ${imageFile.size} bytes`);
          
          // Convert file to base64 for Cloudinary upload
          const buffer = await imageFile.arrayBuffer();
          const base64String = Buffer.from(buffer).toString('base64');
          const mimeType = imageFile.type || 'image/jpeg';
          const base64Image = `data:${mimeType};base64,${base64String}`;
          
          // Upload to Cloudinary
          const tempVisitId = mobileId || uuidv4();
          finalImagePath = await saveCanvassingImage(base64Image, tempVisitId);
          console.log(`Image file uploaded successfully: ${finalImagePath}`);
        } catch (imageError) {
          console.error('Error uploading canvassing image file:', imageError);
          // Continue with visit creation even if image upload fails
        }
      } else if (imagePath && imagePath.startsWith('data:')) {
        // Handle base64 image from JSON request (existing behavior)
        try {
          console.log(`Uploading base64 image for new visit`);
          const tempVisitId = uuidv4(); // Generate temp ID for Cloudinary
          finalImagePath = await saveCanvassingImage(imagePath, tempVisitId);
          console.log(`Base64 image uploaded successfully: ${finalImagePath}`);
        } catch (imageError) {
          console.error('Error uploading canvassing base64 image:', imageError);
          // Continue with visit creation even if image upload fails
        }
      } else if (imagePath) {
        // If imagePath is provided but not base64, use it directly (URL)
        finalImagePath = imagePath;
      }

      // Create the visit with the image path
      const visitData: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contactMethod: normalizeContactMethod(contactMethod),
        contactMethod2: contactMethod2 || null,
        contactMethod3: contactMethod3 || null,
        contactMethod4: contactMethod4 || null,
        houseName,
        vendorName: vendorName || null,
        comments: comments || null,
        streetAddress: streetAddress || null,
        neighborhood: neighborhood || null,
        city: city || null,
        postalCode: postalCode || null,
        imagePath: finalImagePath,
        mobileId: mobileId || uuidv4(),
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        responseReceived: responseReceived || null,
        responseDate: responseDate ? new Date(responseDate) : null
      }

      const visit = await prisma.canvassingVisit.create({
        data: visitData
      })

      // Create the visit user relationship
      await prisma.canvassingVisitUser.create({
        data: {
          visitId: visit.id,
          userId: user.id,
          userName: user.name || user.email || 'Unknown User',
          isCreator: true
        }
      })

      // Get the enriched visit data with user information
      const enrichedVisit = await prisma.canvassingVisit.findUnique({
        where: { id: visit.id },
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
          originalRevisits: {
            include: {
              newVisit: {
                select: {
                  id: true,
                  houseName: true,
                  responseReceived: true,
                  createdAt: true
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
                select: {
                  id: true,
                  houseName: true,
                  responseReceived: true,
                  createdAt: true
                }
              }
            }
          }
        }
      })

      // Get visit configuration for revisit logic
      const visitConfig = await prisma.visitConfiguration.findFirst({
        where: { isActive: true },
        select: { revisitDelayHours: true }
      })
      const revisitDelayHours = visitConfig?.revisitDelayHours || 168

      // Add revisit information
      const hoursSinceVisit = (Date.now() - visit.createdAt.getTime()) / (1000 * 60 * 60)
      const canRevisit = (visit.responseReceived === 'pending' || visit.responseReceived === 'no_response' || visit.responseReceived === null) && hoursSinceVisit >= revisitDelayHours

      // Count visits for this property
      
      
      // Format revisit information
      const originalVisit = (enrichedVisit?.revisitOf && enrichedVisit.revisitOf.length > 0) ? {
        id: enrichedVisit.revisitOf[0].originalVisit.id,
        houseName: enrichedVisit.revisitOf[0].originalVisit.houseName,
        responseReceived: enrichedVisit.revisitOf[0].originalVisit.responseReceived,
        createdAt: enrichedVisit.revisitOf[0].originalVisit.createdAt
      } : null

      const revisitInfo = (enrichedVisit?.revisitOf && enrichedVisit.revisitOf.length > 0) ? {
        hoursSinceOriginal: Math.round((enrichedVisit.createdAt.getTime() - enrichedVisit.revisitOf[0].originalVisit.createdAt.getTime()) / (1000 * 60 * 60)),
        revisitReason: enrichedVisit.revisitOf[0].revisitReason || 'Follow-up visit'
      } : null

      const revisits = enrichedVisit?.originalRevisits?.map((revisit: any) => ({
        id: revisit.id,
        newVisitId: revisit.newVisit.id,
        revisitReason: revisit.revisitReason,
        createdAt: revisit.createdAt,
        newVisit: {
          id: revisit.newVisit.id,
          houseName: revisit.newVisit.houseName,
          responseReceived: revisit.newVisit.responseReceived,
          createdAt: revisit.newVisit.createdAt
        }
      })) || []

      const enrichedVisitWithRevisit = {
        ...enrichedVisit,
        userNames: enrichedVisit?.visitUsers && enrichedVisit.visitUsers.length > 0 ? enrichedVisit.visitUsers.map((vu: any) => vu.userName).join(', ') : '',
        users: enrichedVisit?.visitUsers && enrichedVisit.visitUsers.length > 0 ? enrichedVisit.visitUsers.map((vu: any) => ({
          id: vu.user.id,
          name: vu.user.name,
          email: vu.user.email,
          isCreator: vu.isCreator,
          joinedAt: vu.joinedAt
        })) : [],
        contactMethods: [
          enrichedVisit?.contactMethod,
          enrichedVisit?.contactMethod2,
          enrichedVisit?.contactMethod3,
          enrichedVisit?.contactMethod4
        ].filter(Boolean),
        canRevisit,
        hoursSinceVisit: Math.round(hoursSinceVisit),
        hoursUntilRevisit: canRevisit ? 0 : Math.round(revisitDelayHours - hoursSinceVisit),
        // Revisit information
        originalVisit,
        revisitInfo,
        revisits: revisits.length > 0 ? revisits : undefined,
        isRevisit: originalVisit !== null,
        serverId: enrichedVisit?.id // Add serverId for mobile app
      }

      // Log activity using logging service
      const processingTime = Date.now() - startTime
      await loggingService.logActivity(
        user.id,
        ActivityType.CANVASSING_VISIT,
        EntityType.CANVASSING_VISIT,
        visit.id,
        {
          houseName,
          contactMethod,
          hasLocation: !!(latitude && longitude),
          hasImage: !!finalImagePath,
          hasVendor: !!vendorName,
          imageUploaded: !!(imagePath && imagePath.startsWith('data:'))
        },
        context.deviceType,
        processingTime
      )

      console.log(`Single visit created in ${processingTime}ms: ${visit.id}`)

      return NextResponse.json({
        success: true,
        data: {
          visits: [enrichedVisitWithRevisit],
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
        message: 'Visit created successfully',
        processingTime
      }, { status: 201 })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    await loggingService.logError(
      error as Error,
      'canvassingvisits/POST',
      user?.id,
      context
    )
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