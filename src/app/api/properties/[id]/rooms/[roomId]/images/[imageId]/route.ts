// src/app/api/properties/[id]/rooms/[roomId]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { deleteRoomImage, saveRoomImages } from '@/lib/utils/fileStorage';

// GET: Récupère une image spécifique
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
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

    // Récupérer l'image spécifique
    const image = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Formater la réponse pour correspondre à l'interface attendue
    return NextResponse.json({ 
      image: {
        id: image.id.toString(),
        url: image.imagePath,
        createdAt: image.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching room image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room image' },
      { status: 500 }
    );
  }
}

// DELETE: Supprime une image
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
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
    
    // Vérifier si l'image existe
    const image = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Supprimer le fichier physique
    // Assumons que deleteRoomImage est une fonction utilitaire qui supprime le fichier
    // Cette fonction devrait être implémentée dans fileStorage.ts
    await deleteRoomImage(image.imagePath);
    
    // Supprimer l'enregistrement dans la base de données
    await prisma.roomImage.delete({
      where: {
        id: imageId,
      },
    });
    
    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting room image:', error);
    return NextResponse.json(
      { error: 'Failed to delete room image' },
      { status: 500 }
    );
  }
}

// PATCH: Met à jour une image existante
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string; roomId: string; imageId: string }> }
) {
  const params = await props.params;
  
  try {
    const propertyId = parseInt(params.id);
    const roomId = parseInt(params.roomId);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(propertyId) || isNaN(roomId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid property ID, room ID, or image ID' },
        { status: 400 }
      );
    }
    
    // Récupérer les données de la requête
    const body = await request.json();
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }
    
    // Vérifier si la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
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
    
    // Vérifier si l'image existe
    const existingImage = await prisma.roomImage.findFirst({
      where: {
        id: imageId,
        roomId: roomId,
      },
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // 1. Supprimer l'ancienne image du système de fichiers
    await deleteRoomImage(existingImage.imagePath);
    
    // 2. Sauvegarder la nouvelle image
    // Puisque saveRoomImages prend un tableau de base64, nous créons un tableau avec un seul élément
    const savedImagePaths = await saveRoomImages(
      [body.image], 
      property.reference,
      room.code
    );
    
    if (savedImagePaths.length === 0) {
      return NextResponse.json(
        { error: 'Failed to save new image' },
        { status: 500 }
      );
    }
    
    const newImagePath = savedImagePaths[0];
    
    // 3. Mettre à jour le chemin dans la base de données
    const updatedImage = await prisma.roomImage.update({
      where: {
        id: imageId,
      },
      data: {
        imagePath: newImagePath,
      },
    });
    
    return NextResponse.json({ 
      image: {
        id: updatedImage.id.toString(),
        url: updatedImage.imagePath,
        createdAt: updatedImage.createdAt.toISOString()
      },
      message: 'Image updated successfully'
    });
  } catch (error) {
    console.error('Error updating room image:', error);
    return NextResponse.json(
      { error: 'Failed to update room image' },
      { status: 500 }
    );
  }
}