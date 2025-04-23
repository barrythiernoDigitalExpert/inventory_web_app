// src/app/api/properties/[id]/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveRoomImages } from '@/lib/utils/fileStorage';

// GET: Récupère les pièces d'une propriété
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    // Vérifier si la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Récupérer les pièces avec leurs images et éléments
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        images: true,
        items: true
      }
    });
    
    const formattedRooms = rooms.map((room: { id: { toString: () => any; }; name: any; images: string | any[]; items: string | any[]; }) => ({
      id: room.id.toString(),
      name: room.name,
      image: room.images.length > 0 ? room.images[0].imagePath : '',
      itemCount: room.items.length,
      hasImages: room.images.length > 0
    }));
    
    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST: Ajoute une pièce à une propriété
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { code, name, type, images } = body;
    
    if (!code || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Vérifier si la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Créer la pièce
    const room = await prisma.room.create({
      data: {
        propertyId,
        code,
        name,
        type
      }
    });
    
    // Sauvegarder les images si fournies
    if (images && images.length > 0) {
      const imagePaths = await saveRoomImages(images, property.reference, code);
      
      // Créer les entrées pour les images
      await Promise.all(
        imagePaths.map(imagePath => 
          prisma.roomImage.create({
            data: {
              roomId: room.id,
              imagePath
            }
          })
        )
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      room: {
        id: room.id.toString(),
        name,
        code,
        type
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}