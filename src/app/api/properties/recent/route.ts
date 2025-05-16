// src/app/api/properties/recent/route.ts
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
    
    // Optimize query based on user role
    const isAdmin = user.role === UserRole.ADMIN;
    
    // Récupérer les propriétés récentes avec leurs pièces
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
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        reference: true,
        name: true,
        imagePath: true,
        updatedAt: true,
        roomCount: true,
        imageCount: true,
        userId: true,
        // Pour calculer le statut, nous avons besoin des pièces et de leurs images
        rooms: {
          select: {
            id: true,
            _count: {
              select: {
                images: true
              }
            }
          }
        },
        // For admins, include minimal owner info
        user: isAdmin ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined
      }
    });
    
    const formattedProperties = properties.map(property => {
      // Déterminer le statut en fonction du nombre d'images et de pièces
      let status: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
      
      // Si le property a des images
      if (property.imageCount > 0) {
        // Si toutes les pièces ont au moins une image, on considère que c'est terminé
        const roomsWithImages = property.rooms.filter(room => room._count.images > 0);
        status = roomsWithImages.length >= property.roomCount ? 'Completed' : 'In Progress';
      }
      
      return {
        id: property.id.toString(),
        reference: property.reference,
        name: property.name || '',
        image: property.imagePath || '',
        lastUpdated: property.updatedAt.toISOString().split('T')[0],
        status,
        // Include owner info for admin users
        ...(isAdmin && property.user && { 
          owner: {
            id: property.user.id,
            name: property.user.name,
            email: property.user.email
          }
        })
      };
    });
    
    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching recent properties:', error);
    return NextResponse.json({ error: 'Failed to fetch recent properties' }, { status: 500 });
  }
}