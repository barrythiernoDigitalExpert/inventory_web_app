// src/app/api/properties/[id]/rooms/[roomId]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';

// GET: Retrieve all images for a room
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid property ID or room ID' },
        { status: 400 }
      );
    }
    
    // Verify room belongs to property
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: propertyId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or does not belong to specified property' },
        { status: 404 }
      );
    }
    
    // Get all images for the room with sorting
    const images = await prisma.roomImage.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
    
    // Format response
    const formattedImages = images.map(image => ({
      id: image.id.toString(),
      url: image.imagePath,
      isMainImage: image.isMainImage,
      sortOrder: image.sortOrder,
      description: image.description,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString()
    }));
    
    return NextResponse.json({ images: formattedImages });
  } catch (error) {
    console.error('Error fetching room images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room images' },
      { status: 500 }
    );
  }
}

// POST: Add images to a room
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid property ID or room ID' },
        { status: 400 }
      );
    }
    
    // Verify room belongs to property
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: propertyId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or does not belong to specified property' },
        { status: 404 }
      );
    }
    
    // Get property reference for file storage
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const { images, descriptions, mainImageIndex } = await request.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }
    
    // Save images to storage
    const imagePaths = await saveRoomImages(images, property.reference, room.code);
    
    // Get the current maximum sortOrder
    const maxOrderResult = await prisma.roomImage.findFirst({
      where: { roomId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    
    let nextSortOrder = (maxOrderResult?.sortOrder || 0) + 1;
    
    // Create database entries for the images
    const createdImages = await Promise.all(
      imagePaths.map((imagePath, index) => 
        prisma.roomImage.create({
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
    
    // Update room and property image counts
    await prisma.room.update({
      where: { id: roomId },
      data: { 
        imageCount: { increment: imagePaths.length }
      }
    });
    
    await prisma.property.update({
      where: { id: propertyId },
      data: { 
        imageCount: { increment: imagePaths.length }
      }
    });
    
    // Format response
    const formattedImages = createdImages.map(image => ({
      id: image.id.toString(),
      url: image.imagePath,
      isMainImage: image.isMainImage,
      sortOrder: image.sortOrder,
      description: image.description,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString()
    }));
    
    return NextResponse.json({ 
      success: true,
      images: formattedImages
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding room images:', error);
    return NextResponse.json(
      { error: 'Failed to add room images' },
      { status: 500 }
    );
  }
}