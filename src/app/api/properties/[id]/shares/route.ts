// src/app/api/properties/[id]/shares/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

// GET: Retrieve shares for a property
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
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
    if (property.user.email !== session.user.email && session.user.role != "ADMIN") {
      return NextResponse.json({ error: 'Forbidden: You do not own this property '  }, { status: 403 });
    }

    const shares = await prisma.propertyShare.findMany({
      where: { propertyId: parseInt(propertyId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(shares);
    
  } catch (error) {
    console.error('Error fetching property shares:', error);
    return NextResponse.json({ error: 'Failed to fetch property shares' }, { status: 500 });
  }
}

// POST: Add a new share to a property
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
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

    const body = await request.json();
    const { userId, canEdit, canDelete } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if the target user exists and is a regular user (not ADMIN)
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role !== 'USER') {
      return NextResponse.json({ error: 'Can only share with regular users' }, { status: 400 });
    }

    // Check if share already exists
    const existingShare = await prisma.propertyShare.findUnique({
      where: {
        propertyId_userId: {
          propertyId: parseInt(propertyId),
          userId: parseInt(userId),
        },
      },
    });

    if (existingShare) {
      // Update existing share
      const updatedShare = await prisma.propertyShare.update({
        where: { id: existingShare.id },
        data: {
          canEdit: canEdit === true,
          canDelete: canDelete === true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(updatedShare);
    } else {
      // Create new share
      const newShare = await prisma.propertyShare.create({
        data: {
          property: { connect: { id: parseInt(propertyId) } },
          user: { connect: { id: parseInt(userId) } },
          canEdit: canEdit === true,
          canDelete: canDelete === true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json(newShare, { status: 201 });
    }
  } catch (error) {
    console.error('Error sharing property:', error);
    return NextResponse.json({ error: 'Failed to share property' }, { status: 500 });
  }
}