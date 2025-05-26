// src/app/api/sync/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { InventoryStatus } from '@prisma/client';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

/**
 * POST: Finalise une session de synchronisation et met à jour les statuts
 */
export async function POST(request: NextRequest) {
  try {
        const authResult = await verifyJwtAuth(request);
        if (authResult.error) {
          return authResult.error;
        }
        
        const user = authResult.user;

    // Récupérer les données nécessaires
    const { syncId, propertyReferences = [], roomUpdates = [] } = await request.json();

    if (!syncId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sync ID is required' 
      }, { status: 400 });
    }

    // Vérifier si la synchronisation existe et appartient à l'utilisateur
    const syncLog = await prisma.syncLog.findFirst({
      where: {
        id: parseInt(syncId),
        userId: user.id
      }
    });

    if (!syncLog) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid sync session' 
      }, { status: 404 });
    }

    // Mise à jour des statuts des propriétés
    const propertyResults = [];
    if (propertyReferences.length > 0) {
      for (const reference of propertyReferences) {
        // Trouver la propriété par référence
        const property = await prisma.property.findFirst({
          where: {
            reference,
            OR: [
              { userId: user.id },
              { sharedWith: { some: { userId: user.id, canEdit: true } } }
            ]
          },
          include: {
            rooms: {
              select: {
                id: true,
                isComplete: true
              }
            }
          }
        });

        if (!property) continue;

        // Vérifier si toutes les pièces sont complètes
        const allRoomsComplete = property.rooms.length > 0 && 
                               property.rooms.every(room => room.isComplete);
        
        // Déterminer le statut d'inventaire
        let inventoryStatus = property.inventoryStatus;
        let completedAt = property.completedAt;
        
        if (allRoomsComplete && inventoryStatus !== InventoryStatus.FINALIZED) {
          inventoryStatus = InventoryStatus.COMPLETED;
          completedAt = new Date();
        }

        // Mettre à jour le statut de la propriété
        await prisma.property.update({
          where: { id: property.id },
          data: { 
            inventoryStatus,
            completedAt,
            updatedAt: new Date()
          }
        });

        propertyResults.push({
          reference,
          status: inventoryStatus,
          success: true
        });
      }
    }

    // Mise à jour des statuts des pièces
    const roomResults = [];
    if (roomUpdates.length > 0) {
      for (const update of roomUpdates) {
        const { id, propertyReference, roomCode, isComplete } = update;
        
        // Trouver la pièce soit par ID, soit par référence de propriété et code
        let room;
        if (id) {
          room = await prisma.room.findFirst({
            where: {
              id: parseInt(id),
              property: {
                OR: [
                  { userId: user.id },
                  { sharedWith: { some: { userId: user.id, canEdit: true } } }
                ]
              }
            }
          });
        } else if (propertyReference && roomCode) {
          room = await prisma.room.findFirst({
            where: {
              code: roomCode,
              property: {
                reference: propertyReference,
                OR: [
                  { userId: user.id },
                  { sharedWith: { some: { userId: user.id, canEdit: true } } }
                ]
              }
            }
          });
        }

        if (!room) continue;

        // Mettre à jour le statut de la pièce
        await prisma.room.update({
          where: { id: room.id },
          data: { 
            isComplete: isComplete === true,
            updatedAt: new Date()
          }
        });

        roomResults.push({
          id: room.id,
          code: room.code,
          status: isComplete ? 'complete' : 'in_progress',
          success: true
        });
      }
    }

    // Marquer la synchronisation comme terminée
    await prisma.syncLog.update({
      where: { id: parseInt(syncId) },
      data: {
        syncCompleted: new Date(),
        syncStatus: 'completed'
      }
    });

    // Enregistrer l'activité utilisateur
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'sync_completed',
        details: `Sync completed: ${propertyResults.length} properties, ${roomResults.length} rooms updated`,
        deviceType: 'mobile',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        properties: propertyResults,
        rooms: roomResults,
        syncId: syncId,
        completedAt: new Date().toISOString()
      },
      message: 'Synchronization completed successfully'
    });
  } catch (error) {
    console.error('Sync complete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}