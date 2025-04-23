// src/app/api/properties/recent/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET() {
  try {
    // Récupérer les propriétés récentes avec leurs pièces et éléments
    const properties = await prisma.property.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5,
      include: {
        rooms: {
          include: {
            items: true
          }
        }
      }
    });
    
    const formattedProperties = properties.map((property: { rooms: any[]; id: { toString: () => any; }; reference: any; name: any; imagePath: any; updatedAt: { toISOString: () => string; }; }) => {
      // Calculer le nombre total d'éléments
      const itemCount = property.rooms.reduce((total, room) => {
        return total + room.items.length;
      }, 0);
      
      // Déterminer le statut en fonction du nombre d'objets
      let status: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
      if (itemCount > 0) {
        status = itemCount >= 10 ? 'Completed' : 'In Progress';
      }
      
      return {
        id: property.id.toString(),
        reference: property.reference,
        name: property.name || '',
        image: property.imagePath || '',
        lastUpdated: property.updatedAt.toISOString().split('T')[0],
        status
      };
    });
    
    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching recent properties:', error);
    return NextResponse.json({ error: 'Failed to fetch recent properties' }, { status: 500 });
  }
}