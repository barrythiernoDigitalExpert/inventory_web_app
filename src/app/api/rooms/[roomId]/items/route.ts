// src/app/api/rooms/[roomId]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// Check if user has access to the room
async function checkRoomAccess(roomId: number, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true , role: true }
  });
  
  if (!user) return null;

  if (user.role === 'ADMIN') {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: true
      }
    });
    
    return room ? { room, userId: user.id, isAdmin: true } : null;
  }
  
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      property: {
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
    },
    include: {
      property: true
    }
  });
  
  return room ? { room, userId: user.id } : null;
}

// GET: Retrieve images for a room
export async function GET(request: NextRequest, props: { params: Promise<{ roomId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const params = await props.params;
    const roomId = parseInt(params.roomId);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }
    
    const access = await checkRoomAccess(roomId, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 });
    }
    
    // Retrieve images with sorting
    const images = await prisma.roomImage.findMany({
      where: { roomId },
      orderBy: [
        { isMainImage: 'desc' },
        { sortOrder: 'asc' }
      ]
    });
    
    return NextResponse.json(images.map(image => ({
      id: image.id.toString(),
      url: image.imagePath,
      isMainImage: image.isMainImage,
      description: image.description || '',
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString()
    })));
  } catch (error) {
    console.error('Error fetching room images:', error);
    return NextResponse.json({ error: 'Failed to fetch room images' }, { status: 500 });
  }
}

// POST: Add images to a room
export async function POST(request: NextRequest, props: { params: Promise<{ roomId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  const params = await props.params;
    
    const roomId = parseInt(params.roomId);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }
    
    const access = await checkRoomAccess(roomId, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 });
    }
    
    // Check edit permission if shared
    if (!access.isAdmin && access.room.property.userId !== access.userId) {
      const sharePermission = await prisma.propertyShare.findUnique({
        where: {
          propertyId_userId: {
            propertyId: access.room.propertyId,
            userId: access.userId
          }
        }
      });
      
      if (!sharePermission?.canEdit) {
        return NextResponse.json({ error: 'You do not have permission to edit this property' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const { images, descriptions, mainImageIndex } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    
    // Get current maximum sortOrder
    const maxOrderResult = await prisma.roomImage.findFirst({
      where: { roomId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    
    let nextSortOrder = (maxOrderResult?.sortOrder || 0) + 1;
    
    // Save images and create database entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Save images to storage
      const imagePaths = await saveRoomImages(
        images, 
        access.room.property.reference,
        access.room.code
      );
      
      // Create image records
      const createdImages = await Promise.all(
        imagePaths.map((imagePath, index) => 
          tx.roomImage.create({
            data: {
              roomId,
              imagePath,
              description: descriptions?.[index] || null,
              isMainImage: index === (mainImageIndex || 0),
              sortOrder: nextSortOrder + index
            }
          })
        )
      );
      
      // Update image counts
      await tx.room.update({
        where: { id: roomId },
        data: { 
          imageCount: { increment: imagePaths.length }
        }
      });
      
      await tx.property.update({
        where: { id: access.room.propertyId },
        data: { 
          imageCount: { increment: imagePaths.length }
        }
      });
      
      return createdImages;
    });
    
    // Format response
    const formattedImages = result.map(image => ({
      id: image.id.toString(),
      url: image.imagePath,
      isMainImage: image.isMainImage,
      description: image.description || '',
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString()
    }));
    
    return NextResponse.json({ 
      success: true,
      images: formattedImages
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding room images:', error);
    return NextResponse.json({ error: 'Failed to add room images' }, { status: 500 });
  }
}