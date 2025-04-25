// src/app/api/properties/[id]/rooms/[roomId]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';

// GET: Récupère toutes les images d'une pièce
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid property ID or room ID' },
        { status: 400 }
      );
    }
    
    // Vérifier si la pièce appartient à la propriété
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: propertyId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or does not belong to specified property' },
        { status: 404 }
      );
    }
    
    // Récupérer toutes les images de la pièce
    const images = await prisma.roomImage.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        createdAt: 'asc', // Trier par date de création
      },
    });
    
    // Formater les données pour correspondre à l'interface attendue
    const formattedImages = images.map(image => ({
      id: image.id.toString(),
      url: image.imagePath, // Utiliser imagePath au lieu de url
      createdAt: image.createdAt.toISOString()
    }));
    
    return NextResponse.json({ images: formattedImages });
  } catch (error) {
    console.error('Error fetching room images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room images' },
      { status: 500 }
    );
  }
}

// POST: Ajoute des images à une pièce
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    
    if (isNaN(propertyId) || isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid property ID or room ID' },
        { status: 400 }
      );
    }
    
    // Vérifier si la pièce appartient à la propriété
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        propertyId: propertyId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or does not belong to specified property' },
        { status: 404 }
      );
    }
    
    // Obtenir la référence de la propriété pour le stockage des fichiers
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Récupérer les images du body
    const { images } = await request.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }
    
    // Sauvegarder les images
    const imagePaths = await saveRoomImages(images, property.reference, room.code);
    
    // Créer les entrées pour les images
    const createdImages = await Promise.all(
      imagePaths.map(imagePath => 
        prisma.roomImage.create({
          data: {
            roomId,
            imagePath
          }
        })
      )
    );
    
    // Formater les données pour correspondre à l'interface attendue
    const formattedImages = createdImages.map(image => ({
      id: image.id.toString(),
      url: image.imagePath,
      createdAt: image.createdAt.toISOString()
    }));
    
    return NextResponse.json({ 
      success: true,
      images: formattedImages
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding room images:', error);
    return NextResponse.json(
      { error: 'Failed to add room images' },
      { status: 500 }
    );
  }
}