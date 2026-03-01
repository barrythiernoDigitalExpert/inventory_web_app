import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { prisma } from '@/lib/utils/prisma';

export async function PATCH(
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
    const visitId = params.visitId;
    const body = await request.json();
    const { responseReceived } = body;

    if (responseReceived && !['positive', 'negative', 'no_response', 'pending'].includes(responseReceived)) {
      return NextResponse.json({ error: 'Invalid response type' }, { status: 400 });
    }

    const visit = await prisma.canvassingVisit.findUnique({
      where: { id: visitId },
      include: { visitUsers: { select: { userId: true, isCreator: true } } }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const isCreator = visit.visitUsers.some(vu => vu.userId === user.id && vu.isCreator);
    if (user.role !== 'ADMIN' && !isCreator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedVisit = await prisma.canvassingVisit.update({
      where: { id: visitId },
      data: {
        responseReceived: responseReceived || null,
        responseDate: responseReceived ? new Date() : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updatedVisit });
  } catch (error) {
    console.error('Error updating visit response:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
