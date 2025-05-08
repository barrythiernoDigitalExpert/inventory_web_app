// src/app/api/properties/[id]/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

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
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const params = await props.params;

    
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(propertyId, session.user.email);
    
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
    
    return NextResponse.json(rooms.map(room => ({
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
    })));
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST: Add a room to a property
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const params = await props.params;    
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(propertyId, session.user.email);
    
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
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}