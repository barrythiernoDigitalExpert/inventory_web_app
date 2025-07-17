// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { savePropertyImage, saveRoomImages } from '@/lib/utils/fileStorage';
import { Prisma, UserRole, ActivityType, EntityType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from '@/lib/utils/requestHelpers';

interface RoomImage {
  url?: string;
  description?: string;
}

// GET: Retrieve properties based on user role
export async function GET(request: NextRequest) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  let user: any = null;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeFeatures = searchParams.get('include_features') === 'true';
    
    // Get user with role from session email
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Optimize query based on user role
    const isAdmin = user.role === UserRole.ADMIN;
    
    if (includeFeatures) {
      // Separate query for properties with features
      const propertiesWithFeatures = await prisma.property.findMany({
        where: isAdmin 
          ? undefined 
          : {
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
            },
        include: {
          user: isAdmin ? {
            select: {
              id: true,
              name: true,
              email: true
            }
          } : false,
          propertyFeatures: {
            include: {
              propertyFeature: {
                include: {
                  category: true
                }
              },
              valueFeatureOption: true
            },
            orderBy: [
              { propertyFeature: { category: { sort: 'asc' } } },
              { propertyFeature: { sort: 'asc' } }
            ]
          }
        },
        take: 100,
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform data for response with features
      return NextResponse.json(propertiesWithFeatures.map(property => {
        const baseProperty: any = {
          id: property.id.toString(),
          reference: property.reference,
          name: property.name || '',
          image: property.imagePath || '',
          address: property.address || '',
          roomCount: property.roomCount,
          listingPerson: property.listingPerson,
          imageCount: property.imageCount,
          createdAt: property.createdAt.toISOString(),
          // Include owner info for admin users
          ...(isAdmin && property.user && { 
            owner: {
              id: property.user.id,
              name: property.user.name,
              email: property.user.email
            }
          })
        };

        // Add features
        if (property.propertyFeatures && property.propertyFeatures.length > 0) {
          const groupedFeatures = property.propertyFeatures.reduce((acc: Record<number, any>, pf: any) => {
            const categoryId = pf.propertyFeature.category.id;
            const categoryName = pf.propertyFeature.category.name;
            
            if (!acc[categoryId]) {
              acc[categoryId] = {
                id: categoryId,
                name: categoryName,
                features: []
              };
            }
            
            // Determine the current value based on feature type
            let currentValue = null;
            switch (pf.propertyFeature.type) {
              case 'bool':
                currentValue = pf.valueBool;
                break;
              case 'text':
                currentValue = pf.valueText;
                break;
              case 'integer':
                currentValue = pf.valueInt;
                break;
              case 'float':
                currentValue = pf.valueFloat;
                break;
              case 'select':
                currentValue = pf.valueFeatureOption ? {
                  id: pf.valueFeatureOption.id,
                  value: pf.valueFeatureOption.value
                } : null;
                break;
            }
            
            acc[categoryId].features.push({
              id: pf.propertyFeature.id,
              name: pf.propertyFeature.name,
              type: pf.propertyFeature.type,
              currentValue
            });
            
            return acc;
          }, {});

          baseProperty.features = Object.values(groupedFeatures);
        } else {
          baseProperty.features = [];
        }

        return baseProperty;
      }));
    } else {
      // Original query without features
      const properties = await prisma.property.findMany({
        where: isAdmin 
          ? undefined 
          : {
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
            },
        select: {
          id: true,
          reference: true,
          name: true,
          imagePath: true,
          address: true,
          roomCount: true,
          imageCount: true,
          createdAt: true,
          listingPerson: true,
          userId: true,
          user: isAdmin ? {
            select: {
              id: true,
              name: true,
              email: true
            }
          } : false
        },
        take: 100,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Transform data for response
      return NextResponse.json(properties.map(property => ({
        id: property.id.toString(),
        reference: property.reference,
        name: property.name || '',
        image: property.imagePath || '',
        address: property.address || '',
        roomCount: property.roomCount,
        listingPerson: property.listingPerson,
        imageCount: property.imageCount,
        createdAt: property.createdAt.toISOString(),
        // Include owner info for admin users
        ...(isAdmin && property.user && { 
          owner: {
            id: property.user.id,
            name: property.user.name,
            email: property.user.email
          }
        })
      })));
    }
    
    // Log successful properties view
    const duration = Date.now() - startTime;
    await loggingService.logActivity(
      user.id,
      ActivityType.VIEW_PROPERTY,
      EntityType.PROPERTY,
      undefined,
      { 
        includeFeatures,
        resultCount: 'multiple',
        userRole: user.role
      },
      context.deviceType,
      duration
    );
    
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'properties/GET',
      user?.id,
      context
    );
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
// POST: Create a new property with optimized image processing
export async function POST(request: NextRequest) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  let user: any = null;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { reference, name, image,address, listingPerson, rooms = [] } = body;
    
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }
    
    // Check if reference already exists
    const existingProperty = await prisma.property.findUnique({
      where: { reference }
    });
    
    if (existingProperty) {
      return NextResponse.json({ 
        error: 'A property with this reference already exists' 
      }, { status: 409 });
    }
    
    // Save main image if provided
    let imagePath = null;
    if (image) {
      imagePath = await savePropertyImage(image, reference);
    }
    
    // 1. First create the property
    const createdProperty = await prisma.property.create({
      data: {
        reference,
        name: name || '',
        imagePath,
        address,
        listingPerson,
        userId: user.id,
        roomCount: rooms.length,
        imageCount: 0  // Will update this after processing room images
      }
    });
    
    // 2. Process rooms and images outside of transactions to avoid timeouts
    let totalImageCount = 0;
    
    for (const room of rooms) {
      const { code, name, images = [] } = room;
      
      // Create room
      const createdRoom = await prisma.room.create({
        data: {
          propertyId: createdProperty.id,
          code,
          name,
          imageCount: images.length
        }
      });
      
      // Process room images if any
      if (images.length > 0) {
        try {
          const base64Images = images.map((img: string | RoomImage) => typeof img === 'object' ? img.url : img);
          const descriptions: Record<number, string> = {};
          images.forEach((img: string | RoomImage, index: number) => {
            if (typeof img === 'object' && img.description) {
              descriptions[index] = img.description;
            }
          });
          // Save images to disk using the original function (which only handles URLs)
          const imagePaths = await saveRoomImages(base64Images, reference, code);
          totalImageCount += imagePaths.length;
          
          // Create room image records in smaller batches to avoid timeouts
          const batchSize = 10;
          for (let i = 0; i < imagePaths.length; i += batchSize) {
            const batch = imagePaths.slice(i, i + batchSize);
            
            
            // Process each image individually rather than in a transaction
            for (let j = 0; j < batch.length; j++) {
              const imageIndex = i + j;
              
              await prisma.roomImage.create({
                data: {
                  roomId: createdRoom.id,
                  imagePath: batch[j],
                  description: descriptions[imageIndex] || '',
                  sortOrder: imageIndex,
                  isMainImage: imageIndex === 0   // Only first image is main
                }
              });
            }
          }
        } catch (imageError) {
          console.error(`Error processing images for room ${code}:`, imageError);
          // Continue with other rooms even if one has an error
        }
      }
    }
    
    // 3. Update property with total image count
    await prisma.property.update({
      where: { id: createdProperty.id },
      data: { imageCount: totalImageCount }
    });
    
    // Log successful property creation
    const duration = Date.now() - startTime;
    await loggingService.logActivity(
      user.id,
      ActivityType.CREATE_PROPERTY,
      EntityType.PROPERTY,
      createdProperty.id.toString(),
      {
        reference,
        roomCount: rooms.length,
        totalImageCount,
        hasMainImage: !!imagePath
      },
      context.deviceType,
      duration
    );
    
    return NextResponse.json({ 
      success: true, 
      propertyId: createdProperty.id.toString() 
    }, { status: 201 });
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'properties/POST',
      user?.id,
      context
    );
    console.error('Error creating property:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A property with this reference already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}