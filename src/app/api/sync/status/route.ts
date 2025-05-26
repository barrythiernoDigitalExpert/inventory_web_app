// src/app/api/sync/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { extractPublicIdFromUrl, getOptimizedImageUrl } from '@/lib/utils/cloudinaryHelpers';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

/**
 * GET: Récupère l'état de synchronisation pour l'utilisateur courant
 */
export async function GET(request: NextRequest) {
  try {
        const authResult = await verifyJwtAuth(request);
        if (authResult.error) {
          return authResult.error;
        }
        
        const user = authResult.user;
    
    // Récupérer les propriétés de l'utilisateur avec leurs données de synchronisation
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { userId: user.id },
          { sharedWith: { some: { userId: user.id } } }
        ]
      },
      select: {
        id: true,
        reference: true,
        name: true,
        inventoryStatus: true,
        roomCount: true,
        imageCount: true,
        updatedAt: true,
        rooms: {
          select: {
            id: true,
            code: true,
            name: true,
            isComplete: true,
            imageCount: true,
            images: {
              where: {
                OR: [
                  { syncStatus: 'pending' },
                  { syncStatus: 'conflict' }
                ]
              },
              select: {
                id: true,
                syncStatus: true,
                updatedAt: true
              }
            }
          }
        }
      }
    });

    // Calculer les statistiques de synchronisation
    const syncStatus = properties.map(property => {
      // Calculer le nombre total d'images en attente de synchronisation
      const pendingImageCount = property.rooms.reduce((total, room) => {
        return total + room.images.length;
      }, 0);

      return {
        id: property.id.toString(),
        reference: property.reference,
        name: property.name || property.reference,
        status: property.inventoryStatus,
        roomCount: property.roomCount,
        imageCount: property.imageCount,
        pendingImageCount,
        needsSync: pendingImageCount > 0,
        lastUpdated: property.updatedAt.toISOString(),
        // Données additionnelles pour aider au débogage
        _debug: {
          rooms: property.rooms.map(room => ({
            id: room.id.toString(),
            code: room.code,
            name: room.name,
            isComplete: room.isComplete,
            pendingImages: room.images.length
          }))
        }
      };
    });

    // Récupérer la dernière synchronisation réussie de l'utilisateur
    const lastSuccessfulSync = await prisma.syncLog.findFirst({
      where: {
        userId: user.id,
        syncStatus: 'completed'
      },
      orderBy: {
        syncCompleted: 'desc'
      },
      select: {
        syncCompleted: true,
        itemsSynced: true
      }
    });

    return NextResponse.json({
      success: true,
      data: syncStatus,
      lastSync: lastSuccessfulSync ? {
        timestamp: lastSuccessfulSync.syncCompleted,
        itemsSynced: lastSuccessfulSync.itemsSynced
      } : null
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}