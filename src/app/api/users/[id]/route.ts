// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { UserRole } from '@prisma/client';

// PATCH: Update user role
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const params = await props.params;
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { role } = body;
    
    if (!role || (role !== 'ADMIN' && role !== 'USER')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER
      }
    });
    
    return NextResponse.json({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}