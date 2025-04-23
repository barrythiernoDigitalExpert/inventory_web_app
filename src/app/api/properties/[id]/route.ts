// src/app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { savePropertyImage, deletePropertyFiles } from '@/lib/utils/fileStorage';

// GET: Récupère une propriété par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Récupérer la propriété avec ses pièces et éléments
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            items: true
          }
        }
      }
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Calculer le nombre total d'éléments
    const totalItems = property.rooms.reduce((total: any, room: { items: string | any[]; }) => {
      return total + room.items.length;
    }, 0);
    
    const formattedProperty = {
      id: property.id.toString(),
      reference: property.reference,
      name: property.name || '',
      address: property.address || '',
      image: property.imagePath || '',
      createdAt: property.createdAt.toISOString(),
      totalItems
    };
    
    return NextResponse.json(formattedProperty);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

// PUT: Met à jour une propriété
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, address, image } = body;
    
    // Vérifier si la propriété existe
    const property = await prisma.property.findUnique({
      where: { id }
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Préparer les données à mettre à jour
    const updateData: any = {
      name,
      address
    };
    
    // Si une nouvelle image est fournie, la traiter
    if (image && image !== '') {
      const imagePath = await savePropertyImage(image, property.reference);
      updateData.imagePath = imagePath;
    }
    
    // Mettre à jour la propriété
    await prisma.property.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE: Supprime une propriété
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    // Vérifier si la propriété existe
    const property = await prisma.property.findUnique({
      where: { id }
    });
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Supprimer la propriété (les relations CASCADE se chargeront des tables liées)
    await prisma.property.delete({
      where: { id }
    });
    
    // Supprimer les fichiers associés
    deletePropertyFiles(property.reference);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}