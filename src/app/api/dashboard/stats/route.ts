// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user with role from session email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Filtrer par utilisateur si ce n'est pas un admin
    const isAdmin = user.role === UserRole.ADMIN;
    const userFilter = isAdmin ? {} : {
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
    };
    
    // Nombre total de propriétés
    const totalProperties = await prisma.property.count({
      where: userFilter
    });
    
    // Propriétés mises à jour récemment (7 derniers jours)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentlyUpdated = await prisma.property.count({
      where: {
        ...userFilter,
        updatedAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    // Trouver les propriétés pour déterminer les statuts des inventaires
    const propertiesWithRoomImages = await prisma.property.findMany({
      where: userFilter,
      select: {
        id: true,
        roomCount: true,
        rooms: {
          select: {
            id: true,
            _count: {
              select: {
                images: true
              }
            }
          }
        }
      }
    });
    
    // Déterminer les statuts d'inventaires
    let completedInventories = 0;
    let pendingInventories = 0;
    let inProgressInventories = 0;
    
    propertiesWithRoomImages.forEach(property => {
      if (property.roomCount === 0) {
        // Si pas de pièces définies, considérer comme en attente
        pendingInventories++;
        return;
      }
      
      // Vérifier si toutes les pièces ont au moins une image
      const roomsWithImages = property.rooms.filter(room => room._count.images > 0);
      
      if (roomsWithImages.length === 0) {
        // Aucune pièce n'a d'images
        pendingInventories++;
      } else if (roomsWithImages.length === property.roomCount) {
        // Toutes les pièces ont au moins une image
        completedInventories++;
      } else {
        // Certaines pièces ont des images, mais pas toutes
        inProgressInventories++;
      }
    });
    
    // Stats des utilisateurs (seulement pour admin)
    let userStats = null;
    
    if (isAdmin) {
      const totalUsers = await prisma.user.count();
      
      userStats = {
        totalUsers,
      };
    }
    
    return NextResponse.json({
      totalProperties,
      recentlyUpdated,
      inventories: {
        completed: completedInventories,
        inProgress: inProgressInventories,
        pending: pendingInventories,
        total: completedInventories + inProgressInventories + pendingInventories
      },
      ...(userStats && { users: userStats })
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}