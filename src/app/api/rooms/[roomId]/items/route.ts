// src/app/api/rooms/[roomId]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { saveItemImage } from '@/lib/utils/fileStorage';

// GET: Récupère les éléments d'une pièce
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = parseInt(params.roomId);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }
    
    // Vérifier si la pièce existe
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Récupérer les éléments
    const items = await prisma.inventoryItem.findMany({
      where: { roomId }
    });
    
    const formattedItems = items.map((item: { id: { toString: () => any; }; name: any; description: any;  imagePath: any; notes: any; }) => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description || '',
      image: item.imagePath || '',
      notes: item.notes || ''
    }));
    
    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

// POST: Ajoute un élément à une pièce
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = parseInt(params.roomId);
    
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, description, condition, image, notes } = body;
    
    if (!name || !condition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Vérifier si la pièce existe et récupérer les infos nécessaires
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: true
      }
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Créer l'élément
    const item = await prisma.inventoryItem.create({
      data: {
        roomId,
        name,
        description,
        notes
      }
    });
    
    // Sauvegarder l'image si fournie
    if (image) {
      const imagePath = await saveItemImage(image, room.property.reference, room.code, item.id.toString());
      
      // Mettre à jour le chemin de l'image
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { imagePath }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      item: {
        id: item.id.toString(),
        name,
        description: description || '',
        condition,
        image: item.imagePath || '',
        notes: notes || ''
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}