// src/app/api/sync/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

/**
 * POST: Initialise une nouvelle session de synchronisation
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    
    const user = authResult.user;

    // Récupérer les données nécessaires du corps de la requête
    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device ID is required' 
      }, { status: 400 });
    }

    // Vérifier s'il y a une synchronisation en cours pour ce même utilisateur et appareil
    const existingSync = await prisma.syncLog.findFirst({
      where: {
        userId: user.id,
        deviceId,
        syncStatus: 'in_progress'
      }
    });

    if (existingSync) {
      // Une synchronisation est déjà en cours, on peut la reprendre
      return NextResponse.json({
        success: true,
        data: {
          syncId: existingSync.id,
          message: 'Resuming existing synchronization session',
          started: existingSync.syncStarted.toISOString()
        }
      });
    }

    // Créer une nouvelle entrée de log de synchronisation
    const syncLog = await prisma.syncLog.create({
      data: {
        userId: user.id,
        deviceId,
        syncStarted: new Date(),
        syncStatus: 'in_progress'
      }
    });

    // Enregistrer l'activité utilisateur
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'sync_started',
        details: `Synchronization initiated from device ${deviceId}`,
        deviceType: 'mobile',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        syncId: syncLog.id,
        message: 'Synchronization initiated',
        started: syncLog.syncStarted.toISOString()
      }
    });
  } catch (error) {
    console.error('Sync initiate error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}