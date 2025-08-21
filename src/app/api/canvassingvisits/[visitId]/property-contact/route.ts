// src/app/api/canvassingvisits/[visitId]/property-contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

// PUT: Update visit property name and contact/vendor name
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ visitId: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request)
    if (authResult.error) {
      return authResult.error
    }
   
    const user = authResult.user

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await props.params;
    const visitId = (params.visitId);
    const body = await request.json();
    const { propertyName, contactName } = body;

    // Validate input - at least one field must be provided
    if (!propertyName && !contactName) {
      return NextResponse.json(
        { error: 'At least one field (propertyName or contactName) must be provided' },
        { status: 400 }
      );
    }

    // Find the visit
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        visitUsers: {
          select: {
            userId: true,
            isCreator: true
          }
        }
      }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Check permissions - only creator or admin can update
    const isCreator = visit.visitUsers.some(vu => vu.userId === user.id && vu.isCreator);
    if (user.role !== 'ADMIN' && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized to update this visit' }, { status: 403 });
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date()
    };

    if (propertyName !== undefined) {
      updateData.propertyName = propertyName;
    }

    if (contactName !== undefined) {
      updateData.contactName = contactName;
    }

    // Update the visit
    const updatedVisit = await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: updateData,
      include: {
        visitUsers: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Log the activity
    const updateDetails = [];
    if (propertyName !== undefined) {
      updateDetails.push(`Property name: ${propertyName || 'cleared'}`);
    }
    if (contactName !== undefined) {
      updateDetails.push(`Contact name: ${contactName || 'cleared'}`);
    }

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'CANVASSING_VISIT',
        entityId: visitId,
        entityType: 'CANVASSING_VISIT',
        details: `Updated visit details: ${updateDetails.join(', ')}`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVisit,
      message: 'Visit property and contact information updated successfully'
    });

  } catch (error) {
    console.error('Error updating visit property/contact info:', error);
    return NextResponse.json(
      { error: 'Failed to update visit property and contact information' },
      { status: 500 }
    );
  }
}

