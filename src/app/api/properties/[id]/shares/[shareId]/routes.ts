// src/app/api/properties/[id]/shares/[shareId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// DELETE: Remove a share from a property
export async function DELETE(
  request: NextRequest, 
  props: { params: Promise<{ id: string, shareId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const propertyId = params.id;
    const shareId = params.shareId;

    if (!propertyId || !shareId) {
      return NextResponse.json({ error: 'Property ID and Share ID are required' }, { status: 400 });
    }

    // Check if the user owns this property
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
      include: { user: { select: { email: true } } },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Only the owner can manage shares
    if (property.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden: You do not own this property' }, { status: 403 });
    }

    // Verify the share exists and belongs to this property
    const share = await prisma.propertyShare.findUnique({
      where: { id: parseInt(shareId) },
    });

    if (!share || share.propertyId !== parseInt(propertyId)) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Delete the share
    await prisma.propertyShare.delete({
      where: { id: parseInt(shareId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing property share:', error);
    return NextResponse.json({ error: 'Failed to remove property share' }, { status: 500 });
  }
}