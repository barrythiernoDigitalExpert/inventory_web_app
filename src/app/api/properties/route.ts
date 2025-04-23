// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { savePropertyImage, saveRoomImages } from '@/lib/utils/fileStorage';
import { Prisma } from '@prisma/client';

// GET: Récupère toutes les propriétés
export async function GET() {
  try {
    // Récupérer toutes les propriétés avec le nombre d'éléments
    const properties = await prisma.property.findMany({
      include: {
        rooms: {
          include: {
            items: true
          }
        }
      }
    });
    
    // Formater les données pour correspondre à l'interface attendue
    const formattedProperties = properties.map((property) => {
      // Calculer le nombre total d'éléments
      const totalItems = property.rooms.reduce((total, room) => {
        return total + room.items.length;
      }, 0);
      
      return {
        id: property.id.toString(),
        reference: property.reference,
        name: property.name || '',
        image: property.imagePath || '',
        createdAt: property.createdAt.toISOString(),
        totalItems
      };
    });
    
    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST: Crée une nouvelle propriété
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, image, rooms } = body;
    
    if (!reference || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Vérifier si la référence existe déjà
    const existingProperty = await prisma.property.findUnique({
      where: { reference }
    });
    
    if (existingProperty) {
      return NextResponse.json({ 
        error: 'Une propriété avec cette référence existe déjà' 
      }, { status: 409 });
    }
    
    // 1. Sauvegarder l'image principale
    const imagePath = await savePropertyImage(image, reference);
    
    // 2. Créer la propriété dans la base de données
    const property = await prisma.property.create({
      data: {
        reference,
        imagePath,
        name: ''  // Valeur par défaut
      }
    });
    
    // 3. Créer les pièces et leurs images
    if (rooms && rooms.length > 0) {
      for (const room of rooms) {
        const createdRoom = await prisma.room.create({
          data: {
            propertyId: property.id,
            code: room.code,
            name: room.name
          }
        });
        
        // Sauvegarder les images de la pièce
        if (room.images && room.images.length > 0) {
          const imagePaths = await saveRoomImages(room.images, reference, room.code);
          
          // Créer les entrées pour les images
          await Promise.all(
            imagePaths.map(imagePath => 
              prisma.roomImage.create({
                data: {
                  roomId: createdRoom.id,
                  imagePath
                }
              })
            )
          );
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      propertyId: property.id.toString() 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    
    // Gérer l'erreur de contrainte d'unicité
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Une propriété avec cette référence existe déjà' 
        }, { status: 409 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}