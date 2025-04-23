// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET() {
  try {
    // Nombre total de propriétés
    const totalProperties = await prisma.property.count();
    
    // Propriétés mises à jour récemment (7 derniers jours)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentlyUpdated = await prisma.property.count({
      where: {
        updatedAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    // Propriétés avec inventaires
    const propertiesWithItems = await prisma.property.findMany({
      include: {
        rooms: {
          include: {
            items: true
          }
        }
      }
    });
    
    // Nombre d'inventaires complétés (avec plus de 10 éléments)
    let completedInventories = 0;
    let pendingInventories = 0;
    
    propertiesWithItems.forEach((property: { rooms: any[]; }) => {
      const totalItems = property.rooms.reduce((sum, room) => sum + room.items.length, 0);
      
      if (totalItems >= 10) {
        completedInventories++;
      } else {
        pendingInventories++;
      }
    });
    
    return NextResponse.json({
      totalProperties,
      recentlyUpdated,
      completedInventories,
      pendingInventories
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}