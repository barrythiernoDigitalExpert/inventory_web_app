// src/app/api/sync/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { savePropertyImage, saveRoomImages } from '@/lib/utils/fileStorage'
import { verifyJwtAuth } from '@/lib/utils/auth-jwt'



export async function POST(request: NextRequest) {
  try {
    // Verify JWT authentication
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    const user = authResult.user!;

    const { syncId, rooms } = await request.json();

    if (!syncId || !Array.isArray(rooms)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: syncId and rooms array'
      }, { status: 400 });
    }

    // Verify sync session belongs to the authenticated user
    const syncLog = await prisma.syncLog.findFirst({
      where: {
        id: parseInt(syncId),
        userId: user.id,
        syncStatus: 'in_progress'
      }
    });
    
    if (!syncLog) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sync session'
      }, { status: 400 });
    }
    
    // Process each room
    const results = [];
    for (const roomData of rooms) {
      const { propertyReference, roomCode, roomName } = roomData;
      
      // Find property
      const property = await prisma.property.findUnique({
        where: { reference: propertyReference }
      });
      
      if (!property) continue;
      
      // Find or create room
      let room = await prisma.room.findFirst({
        where: {
          propertyId: property.id,
          code: roomCode
        }
      });
      
      if (!room) {
        const sortOrder = parseInt(roomCode.replace(/\D/g, '')) || 0;
        room = await prisma.room.create({
          data: {
            propertyId: property.id,
            code: roomCode,
            name: roomName,
            sortOrder,
            imageCount: 0,
            isComplete: false
          }
        });
        
        // Increment room count
        await prisma.property.update({
          where: { id: property.id },
          data: {
            roomCount: { increment: 1 }
          }
        });
      }
      
      results.push({
        code: roomCode,
        name: roomName,
        id: room.id,
        created: !!room
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        roomsProcessed: results.length,
        rooms: results
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}