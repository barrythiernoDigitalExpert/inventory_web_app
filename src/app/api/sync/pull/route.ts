// src/app/api/sync/pull/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getOptimizedImageUrl } from '@/lib/utils/cloudinaryHelpers';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

/**
 * GET: Récupère les mises à jour depuis une date donnée
 */
export async function GET(request: NextRequest) {
  try {
        const authResult = await verifyJwtAuth(request);
        if (authResult.error) {
          return authResult.error;
        }
        
        const user = authResult.user;

    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const lastSyncTimestamp = url.searchParams.get('lastSyncTimestamp');
    const propertyReference = url.searchParams.get('propertyReference');

    // Valider le timestamp
    let lastSync = new Date(0); // 1970-01-01 par défaut
    if (lastSyncTimestamp) {
      const timestamp = parseInt(lastSyncTimestamp);
      if (!isNaN(timestamp)) {
        lastSync = new Date(timestamp);
      }
    }

    // Construire la requête de base
    let whereClause: any = {
      OR: [
        { userId: user.id },
        { sharedWith: { some: { userId: user.id } } }
      ],
      updatedAt: { gt: lastSync }
    };
    
    // Si un propertyReference est spécifié, filtrer les résultats
    if (propertyReference) {
      whereClause.reference = propertyReference;
    }

    // Récupérer les propriétés mises à jour depuis le dernier sync
    const updatedProperties = await prisma.property.findMany({
      where: whereClause,
      include: {
        rooms: {
          where: {
            updatedAt: { gt: lastSync }
          },
          include: {
            images: {
              where: {
                updatedAt: { gt: lastSync }
              },
              orderBy: {
                sortOrder: 'asc'
              }
            }
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transformer les données pour la réponse
    const response = updatedProperties.map(property => ({
      id: property.id.toString(),
      reference: property.reference,
      name: property.name || '',
      imagePath : property.imagePath || '',
      address: property.address || '',
      listingPerson: property.listingPerson || '',
      roomCount: property.roomCount,
      imageCount: property.imageCount,
      status: property.inventoryStatus,
      startedAt: property.startedAt?.toISOString(),
      completedAt: property.completedAt?.toISOString(),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      rooms: property.rooms.map(room => ({
        id: room.id.toString(),
        code: room.code,
        name: room.name,
        isComplete: room.isComplete,
        imageCount: room.imageCount,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
        images: room.images.map(image => ({
          id: image.id.toString(),
          url: getOptimizedImageUrl(image.imagePath, { width: 800, quality: 80 }),
          fullUrl: image.imagePath,
          description: image.description || '',
          sortOrder: image.sortOrder,
          isMainImage: image.isMainImage,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString()
        }))
      }))
    }));

    // Enregistrer l'activité utilisateur
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'sync_pull',
        details: `Retrieved ${response.length} updated properties since ${lastSync.toISOString()}`,
        deviceType: 'mobile',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().getTime(),
      message: `Retrieved ${response.length} updated properties`
    });
  } catch (error) {
    console.error('Pull updates error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}