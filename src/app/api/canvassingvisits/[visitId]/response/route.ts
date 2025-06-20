// src/app/api/canvassing-visits/[visitId]/response/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { CanvassingService } from '@/lib/services/canvassingService';
import { ResponseType } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

// PUT: Update visit response
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
    const { responseReceived, comments } = body;

    // Find the visit
    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      select: { userId: true, id: true }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Check permissions - only owner or admin can update
    if (user.role !== 'ADMIN' && visit.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this visit' }, { status: 403 });
    }

    // Validate response type if provided
    if (responseReceived && !['positive', 'negative', 'no_response', 'pending'].includes(responseReceived)) {
      return NextResponse.json(
        { error: 'Invalid response type' },
        { status: 400 }
      );
    }

    // Update the visit
    const updatedVisit = await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: {
        responseReceived: responseReceived || null,
        comments: comments || null,
        responseDate: responseReceived ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Log the activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'update_visit_response',
        entityId: parseInt(visitId),
        entityType: 'canvassing_visit',
        details: `Updated visit response: ${responseReceived || 'cleared'} with comments: ${comments ? 'yes' : 'no'}`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVisit,
      message: 'Visit response updated successfully'
    });

  } catch (error) {
    console.error('Error updating visit response:', error);
    return NextResponse.json(
      { error: 'Failed to update visit response' },
      { status: 500 }
    );
  }
}
// GET: Get specific visit details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ visitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

   const params = await props.params;
        const visitId = (params.visitId);

    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Check permissions - users can only see their own visits unless they're admin
    if (user.role !== 'ADMIN' && visit.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(visit);

  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visit details' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a visit (admin only)
export async function DELETE(
  request: NextRequest,
   props: { params: Promise<{ visitId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const params = await props.params;
        const visitId = (params.visitId);

    const result = await CanvassingService.deleteVisit(visitId, user.id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting visit:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Visit not found') {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete visit' },
      { status: 500 }
    );
  }
}