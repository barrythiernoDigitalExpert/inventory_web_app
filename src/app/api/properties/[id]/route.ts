// src/app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { savePropertyImage, deletePropertyFiles } from '@/lib/utils/fileStorage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// Helper function to check property access
async function checkPropertyAccess(propertyId: number, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true , role:true}
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

// GET: Retrieve a property by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(id, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Get property with rooms
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        sharedWith: {
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
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: property.id.toString(),
      reference: property.reference,
      name: property.name || '',
      address: property.address || '',
      street: property.street || '',
      city: property.city || '',
      state: property.state || '',
      postalCode: property.postalCode || '',
      listingPerson : property.listingPerson,
      country: property.country || '',
      image: property.imagePath || '',
      roomCount: property.roomCount,
      imageCount: property.imageCount,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      owner: property.user,
      sharedWith: property.sharedWith.map(share => ({
        user: share.user,
        canEdit: share.canEdit,
        canDelete: share.canDelete
      })),
      rooms: property.rooms.map(room => ({
        id: room.id.toString(),
        code: room.code,
        name: room.name,
        imageCount: room.imageCount,
        images: room.images.map(image => ({
          id: image.id.toString(),
          path: image.imagePath,
          isMain: image.isMainImage,
          description: image.description || ''
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

// PUT: Update a property
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  const params = await props.params;
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(id, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Check if user has edit permission if the property is shared
    if (access.property.userId !== access.userId) {
      const sharePermission = await prisma.propertyShare.findUnique({
        where: {
          propertyId_userId: {
            propertyId: id,
            userId: access.userId
          }
        }
      });
      
      if (!sharePermission?.canEdit) {
        return NextResponse.json({ error: 'You do not have permission to edit this property' }, { status: 403 });
      }
    }
    
    const body = await request.json();
    const { name, street, city, state, postalCode, country, address, image, listingPerson } = body;
    
    // Prepare update data
    const updateData: any = {
      name,
      street,
      city,
      state,
      postalCode,
      country,
      address,
      listingPerson
    };
    
    // Process new image if provided
    if (image && image !== access.property.imagePath) {
      const imagePath = await savePropertyImage(image, access.property.reference);
      updateData.imagePath = imagePath;
    }
    
    // Update property
    await prisma.property.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE: Delete a property
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  const params = await props.params;
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const access = await checkPropertyAccess(id, session.user.email);
    
    if (!access) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }
    
    // Check delete permission if the property is shared
    if (access.property.userId !== access.userId) {
      const sharePermission = await prisma.propertyShare.findUnique({
        where: {
          propertyId_userId: {
            propertyId: id,
            userId: access.userId
          }
        }
      });
      
      if (!sharePermission?.canDelete) {
        return NextResponse.json({ error: 'You do not have permission to delete this property' }, { status: 403 });
      }
    }
    
    // Delete property (cascade will handle related records)
    await prisma.property.delete({
      where: { id }
    });
    
    // Delete files
    deletePropertyFiles(access.property.reference);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}