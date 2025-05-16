// src/app/api/properties/[id]/rooms/[roomId]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { deleteRoomImage, saveRoomImages } from '@/lib/utils/fileStorage';
import { extractPublicIdFromUrl, addCacheBustingToUrl } from '@/lib/utils/cloudinaryHelpers';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
   cloud_name: "doklxv5l6",
    api_key: "341989844846657",
    api_secret: "kc5k5Zfx-OdWzmOovT8nxaL16o8",
    secure: true
});

// GET: Retrieve a specific image
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
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

    // Get the specific image
    const image = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Add cache busting timestamp
    const cachedUrl = addCacheBustingToUrl(image.imagePath);

    // Format response
    return NextResponse.json({ 
      image: {
        id: image.id.toString(),
        url: cachedUrl,
        isMainImage: image.isMainImage,
        sortOrder: image.sortOrder,
        description: image.description,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching room image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room image' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing image
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
        { status: 400 }
      );
    }
    
    // Get request data
    const { image, description, isMainImage, sortOrder } = await request.json();
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
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
    
    // Check if image exists
    const existingImage = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Handle main image change if requested
    if (isMainImage === true) {
      // Reset all other images to not be main image
      await prisma.roomImage.updateMany({
        where: {
          roomId: roomId,
          id: { not: imageId },
          isMainImage: true
        },
        data: {
          isMainImage: false
        }
      });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Update description if provided
    if (description !== undefined) {
      updateData.description = description;
    }
    
    // Update isMainImage if provided
    if (isMainImage !== undefined) {
      updateData.isMainImage = isMainImage;
    }
    
    // Update sortOrder if provided
    if (sortOrder !== undefined) {
      updateData.sortOrder = sortOrder;
    }
    
    // Update image if provided
    let newImagePath = existingImage.imagePath;
    if (image) {
      const existingPublicId = extractPublicIdFromUrl(existingImage.imagePath);
      
      if (existingPublicId) {
        try {
          // Update existing image in Cloudinary
          const result = await cloudinary.uploader.upload(image, {
            public_id: existingPublicId,
            overwrite: true,
            invalidate: true,
            resource_type: 'image' as 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          });
          
          // Use new URL with timestamp for cache busting
          newImagePath = `${result.secure_url.split('?')[0]}?t=${Date.now()}`;
        } catch (cloudinaryError) {
          console.error('Error updating image in Cloudinary:', cloudinaryError);
          
          // Upload as new image if update fails
          const savedImagePaths = await saveRoomImages(
            [image], 
            property.reference,
            room.code
          );
          
          if (savedImagePaths.length === 0) {
            return NextResponse.json(
              { error: 'Failed to save new image' },
              { status: 500 }
            );
          }
          
          newImagePath = savedImagePaths[0];
        }
      } else {
        // Upload as new image if no public ID exists
        const savedImagePaths = await saveRoomImages(
          [image], 
          property.reference,
          room.code
        );
        
        if (savedImagePaths.length === 0) {
          return NextResponse.json(
            { error: 'Failed to save new image' },
            { status: 500 }
          );
        }
        
        newImagePath = savedImagePaths[0];
      }
      
      updateData.imagePath = newImagePath;
    }
    
    // Update the image record
    const updatedImage = await prisma.roomImage.update({
      where: {
        id: imageId,
      },
      data: updateData
    });
    
    return NextResponse.json({ 
      image: {
        id: updatedImage.id.toString(),
        url: updatedImage.imagePath,
        isMainImage: updatedImage.isMainImage,
        sortOrder: updatedImage.sortOrder,
        description: updatedImage.description,
        createdAt: updatedImage.createdAt.toISOString(),
        updatedAt: updatedImage.updatedAt.toISOString()
      },
      message: 'Image updated successfully'
    });
  } catch (error) {
    console.error('Error updating room image:', error);
    return NextResponse.json(
      { error: 'Failed to update room image' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an image
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
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
    
    // Check if image exists
    const image = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Extract Cloudinary public ID from URL
    const publicId = extractPublicIdFromUrl(image.imagePath);
    
    if (publicId) {
      // Delete image from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    } else {
      // Fall back to older method if public ID extraction fails
      await deleteRoomImage(image.imagePath);
    }
    
    // Delete image record from database
    await prisma.roomImage.delete({
      where: {
        id: imageId,
      },
    });
    
    // Update room and property image counts
    await prisma.room.update({
      where: { id: roomId },
      data: { 
        imageCount: { decrement: 1 }
      }
    });
    
    await prisma.property.update({
      where: { id: propertyId },
      data: { 
        imageCount: { decrement: 1 }
      }
    });
    
    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting room image:', error);
    return NextResponse.json(
      { error: 'Failed to delete room image' },
      { status: 500 }
    );
  }
}