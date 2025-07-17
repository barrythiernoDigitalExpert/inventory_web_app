// src/app/api/properties/[id]/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { ActivityType, EntityType } from '@prisma/client';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from '@/lib/utils/requestHelpers';

// Helper function to check property access with improved null handling
async function checkPropertyAccess(propertyId: number, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true ,role: true }
  });
  
  if (!user) return null;

  if (user.role === 'ADMIN') {
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    return property ? { property, userId: user.id, isAdmin: true } : null;
  }
  
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { userId: user.id },
        {
          sharedWith: {
            some: {
              userId: user.id
            }
          }
        }
      ]
    }
  });
  
  return property ? { property, userId: user.id } : null;
}

// GET: Retrieve rooms for a property
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  let access: any = null;
  let params: any = null;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    params = await props.params;

    
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    access = await checkPropertyAccess(propertyId, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Get rooms with images
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      orderBy: { sortOrder: 'asc' },
      include: {
        images: {
          orderBy: [
            { isMainImage: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    });
    
    const roomsResponse = rooms.map(room => ({
      id: room.id.toString(),
      code: room.code,
      name: room.name,
      imageCount: room.imageCount,
      image: room.images.length > 0 ? room.images[0].imagePath : '',
      hasImages: room.images.length > 0,
      images: room.images.map(image => ({
        id: image.id.toString(),
        path: image.imagePath,
        isMain: image.isMainImage,
        description: image.description || ''
      }))
    }));
    
    // Log successful rooms view
    const duration = Date.now() - startTime;
    await loggingService.logActivity(
      access.userId,
      ActivityType.VIEW_PROPERTY,
      EntityType.ROOM,
      undefined,
      {
        propertyId: propertyId.toString(),
        propertyReference: access.property.reference,
        roomCount: rooms.length,
        totalImages: rooms.reduce((sum, room) => sum + room.imageCount, 0),
        isAdmin: access.isAdmin || false
      },
      context.deviceType,
      duration
    );
    
    return NextResponse.json(roomsResponse);
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'rooms/GET',
      access?.userId,
      { propertyId: params?.id, ...context }
    );
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST: Add a room to a property
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  let access: any = null;
  let params: any = null;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    params = await props.params;    
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    access = await checkPropertyAccess(propertyId, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Check edit permission if shared
    if (!access.isAdmin && access.property.userId !== access.userId) {
      const sharePermission = await prisma.propertyShare.findUnique({
        where: {
          propertyId_userId: {
            propertyId,
            userId: access.userId
          }
        }
      });
      
      if (!sharePermission?.canEdit) {
        return NextResponse.json({ error: 'You do not have permission to edit this property' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const { code, name, images = [] } = body;
    
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }
    
    // Get current max sortOrder
    const lastRoom = await prisma.room.findFirst({
      where: { propertyId },
      orderBy: { sortOrder: 'desc' }
    });
    
    const sortOrder = lastRoom ? lastRoom.sortOrder + 1 : 0;
    
    // Create room with transaction to handle images
    const result = await prisma.$transaction(async (tx) => {
      // Create room
      const room = await tx.room.create({
        data: {
          propertyId,
          code,
          name,
          sortOrder,
          imageCount: images.length
        }
      });
      
      // Process images if provided
      let imagePaths: string[] = [];
      if (images.length > 0) {
        imagePaths = await saveRoomImages(
          images, 
          access.property.reference, 
          code
        );
        
        // Create image records
        await Promise.all(
          imagePaths.map((imagePath, index) => 
            tx.roomImage.create({
              data: {
                roomId: room.id,
                imagePath,
                sortOrder: index,
                isMainImage: index === 0 // First image is main by default
              }
            })
          )
        );
      }
      
      // Update property room count
      await tx.property.update({
        where: { id: propertyId },
        data: { 
          roomCount: { increment: 1 },
          imageCount: { increment: images.length }
        }
      });
      
      return {
        room,
        imagePaths
      };
    });
    
    // Log successful room creation
    const duration = Date.now() - startTime;
    await loggingService.logActivity(
      access.userId,
      ActivityType.ADD_ROOM,
      EntityType.ROOM,
      result.room.id.toString(),
      {
        propertyId: propertyId.toString(),
        propertyReference: access.property.reference,
        roomCode: code,
        roomName: name,
        imageCount: result.imagePaths.length,
        hasImages: result.imagePaths.length > 0
      },
      context.deviceType,
      duration
    );
    
    return NextResponse.json({ 
      success: true, 
      room: {
        id: result.room.id.toString(),
        name,
        code,
        imageCount: result.imagePaths.length,
        images: result.imagePaths.map((path, index) => ({
          path,
          isMain: index === 0
        }))
      }
    }, { status: 201 });
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'rooms/POST',
      access?.userId,
      { propertyId: params?.id, ...context }
    );
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}