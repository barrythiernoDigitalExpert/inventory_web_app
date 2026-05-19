// src/app/api/sync/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { savePropertyImage, saveRoomImages } from '@/lib/utils/fileStorage'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'

// Define interfaces for better type safety
interface ImageToProcess {
  base64: string;
  localId: string;
  description: string;
}

interface CreatedImage {
  id: string;
  localId: string;
  url: string;
  description: string;
  sortOrder: number;
  updated?: boolean;
}

/**
 * POST: Upload images from mobile app and associate them with a room
 * Improved performance and error handling for better synchronization
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authentication first
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const user = authResult.user

    // Get request data
    const formData = await request.formData()
    const syncId = formData.get('syncId')?.toString()
    const propertyReference = formData.get('propertyReference')?.toString()
    const roomCode = formData.get('roomCode')?.toString()
    const roomName = formData.get('roomName')?.toString()
    const hasImages = formData.get('hasImages')?.toString() === 'true'
    const localIds = formData.getAll('localIds[]').map(id => id.toString())
    const descriptions = formData
      .getAll('descriptions[]')
      .map(desc => desc?.toString() || '')
    const images = formData.getAll('images[]')
    const propertyImage = formData.get('propertyImage')?.toString()

    // Validate required fields
    if (!syncId || !propertyReference || !roomCode || !roomName) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: syncId, propertyReference, roomCode, or roomName',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    console.log(`Syncing room ${roomCode} - ${roomName} for property ${propertyReference}`)
    console.log(`Images count: ${images.length}, hasImages flag: ${hasImages}`)

    // Verify sync session exists and is in progress
    const syncLog = await prisma.syncLog.findFirst({
      where: {
        id: parseInt(syncId),
        userId: user.id,
        syncStatus: 'in_progress'
      }
    })

    if (!syncLog) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired sync session',
          processingTime: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Find or create property with optimized queries
    let property = await prisma.property.findUnique({
      where: { reference: propertyReference }
    })

    let propertyImagePath = null
    if (propertyImage) {
      try {
        propertyImagePath = await savePropertyImage(
          propertyImage,
          propertyReference
        )
        console.log(`Property image saved: ${propertyImagePath}`)
      } catch (imageError) {
        console.error('Error saving property image:', imageError)
      }
    }

    if (!property) {
      // Property doesn't exist, create it
      property = await prisma.property.create({
        data: {
          reference: propertyReference,
          name: propertyReference,
          userId: user.id,
          inventoryStatus: 'DRAFT',
          startedAt: new Date(),
          roomCount: 0,
          imageCount: 0,
          imagePath: propertyImagePath
        }
      })

      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'CREATE_PROPERTY',
          entityId: property.id.toString(),
          entityType: 'PROPERTY',
          details: `Property created during sync: ${propertyReference}`,
          deviceType: 'mobile',
          timestamp: new Date()
        }
      })
      
      console.log(`New property created: ${property.id}`)
    } else if (propertyImagePath) {
      // Update property image if provided and different from current
      if (property.imagePath !== propertyImagePath) {
        property = await prisma.property.update({
          where: { id: property.id },
          data: { imagePath: propertyImagePath, updatedAt: new Date() }

        })
        console.log(`Property image updated: ${propertyImagePath}`)
      }
    }

    // Find or create room with optimized query
    let room = await prisma.room.findFirst({
      where: {
        propertyId: property.id,
        code: roomCode
      }
    })

    let roomCreated = false
    let roomUpdated = false
    
    if (!room) {
      // Room doesn't exist, create it
      const sortOrder = parseInt(roomCode.replace(/\D/g, '')) || 0

      room = await prisma.room.create({
        data: {
          propertyId: property.id,
          code: roomCode,
          name: roomName,
          sortOrder,
          imageCount: 0,
          isComplete: false
        }
      })

      roomCreated = true

      // Increment room count for property
      await prisma.property.update({
        where: { id: property.id },
        data: {
          roomCount: { increment: 1 }
        }
      })

      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'ADD_ROOM',
          entityId: room.id.toString(),
          entityType: 'ROOM',
          details: `Room created during sync: ${roomCode} - ${roomName}`,
          deviceType: 'mobile',
          timestamp: new Date()
        }
      })
      
      console.log(`New room created: ${room.id}`)
    } else if (room.name !== roomName) {
      // Room exists but name has changed, update it
      room = await prisma.room.update({
        where: { id: room.id },
        data: { name: roomName, updatedAt: new Date() }
      })
      roomUpdated = true
      console.log(`Room name updated to: ${roomName}`)
    }

    const createdImages: CreatedImage[] = []
    let imageCount = 0

    // Process images if any exist
    if (hasImages && images.length > 0) {
      console.log(`Processing ${images.length} images for room ${roomCode}`)
      const imagesToProcess: ImageToProcess[] = []

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const localId = i < localIds.length ? localIds[i] : uuidv4()
        const description = i < descriptions.length ? descriptions[i] : ''

        let base64Data = ''
        if (typeof image === 'string') {
          base64Data = image
        } else if (image instanceof Blob) {
          const buffer = await image.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          const binary = bytes.reduce(
            (acc, byte) => acc + String.fromCharCode(byte),
            ''
          )
          base64Data = `data:${image.type};base64,${btoa(binary)}`
        } else {
          continue
        }

        imagesToProcess.push({
          base64: base64Data,
          localId,
          description
        })
      }

      if (imagesToProcess.length > 0) {
        console.log(`Saving ${imagesToProcess.length} images to disk`)
        
        const savedImagePaths = await saveRoomImages(
          imagesToProcess.map(img => img.base64),
          propertyReference,
          roomCode
        )

        // Use a transaction for bulk creation for better performance
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < savedImagePaths.length; i++) {
            const imagePath = savedImagePaths[i]
            const { localId, description } = imagesToProcess[i]
            
            // Check if image with this localId already exists to avoid duplicates
            const existingImage = await tx.roomImage.findFirst({
              where: {
                roomId: room!.id,
                localId: localId
              }
            })
            
            if (existingImage) {
              // Update existing image
              const updatedImage = await tx.roomImage.update({
                where: { id: existingImage.id },
                data: {
                  imagePath,
                  description,
                  syncStatus: 'synced',

                }
              })
              
              createdImages.push({
                id: String(updatedImage.id),
                localId,
                url: imagePath,
                description,
                sortOrder: existingImage.sortOrder,
                updated: true
              })
              
              console.log(`Updated existing image: ${updatedImage.id}`)
            } else {
              // Create new image
              const roomImage = await tx.roomImage.create({
                data: {
                  roomId: room!.id,
                  imagePath,
                  localId,
                  description,
                  syncStatus: 'synced',
                  sortOrder: i,
                  isMainImage: i === 0 && room!.imageCount === 0,
                  aiDetected: false
                }
              })

              createdImages.push({
                id: String(roomImage.id),
                localId,
                url: imagePath,
                description,
                sortOrder: i,
                updated: false
              })
              
              console.log(`Created new image: ${roomImage.id}`)
            }
          }
        })

        imageCount = savedImagePaths.length

        // Update image counts
        await prisma.room.update({
          where: { id: room!.id },
          data: {
            imageCount: { increment: imageCount }
          }
        })

        await prisma.property.update({
          where: { id: property.id },
          data: {
            imageCount: { increment: imageCount }
          }
        })
        
        console.log(`Updated image counts - Room: +${imageCount}, Property total: ${property.imageCount + imageCount}`)
      }
    } else {
      // Even for rooms without images, we want to track them in the sync
      console.log(`Room ${roomCode} has no images to process`)
    }

    // Update sync log
    await prisma.syncLog.update({
      where: { id: parseInt(syncId) },
      data: {
        itemsSynced: { increment: imageCount }
      }
    })

    // Log activity
    const activityDetails = imageCount > 0
      ? `${imageCount} images uploaded for ${roomCode} - ${roomName}`
      : roomCreated
        ? `Room ${roomCode} - ${roomName} created without images`
        : roomUpdated
          ? `Room ${roomCode} - ${roomName} updated without images`
          : `Room ${roomCode} - ${roomName} synchronized without changes`;

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'SYNC_DATA',
        entityId: room!.id.toString(),
        entityType: 'ROOM',
        details: activityDetails,
        deviceType: 'mobile',
        timestamp: new Date()
      }
    })

    const responseMessage = imageCount > 0
      ? `Room ${roomName} synced with ${imageCount} images`
      : roomCreated
        ? `Room ${roomName} created successfully`
        : roomUpdated
          ? `Room ${roomName} updated successfully`
          : `Room ${roomName} checked`;
          
    const processingTime = Date.now() - startTime
    console.log(`Sync completed in ${processingTime}ms: ${responseMessage}`)

    return NextResponse.json({
      success: true,
      data: {
        property: {
          id: property.id,
          reference: property.reference
        },
        room: {
          id: room!.id,
          code: room!.code,
          name: room!.name,
          created: roomCreated,
          updated: roomUpdated
        },
        images: createdImages,
        imageCount,
        message: responseMessage,
        processingTime
      }
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Sync upload error (${processingTime}ms):`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        processingTime
      },
      { status: 500 }
    )
  }
}