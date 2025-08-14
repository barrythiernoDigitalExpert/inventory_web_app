// src/app/api/mobile/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import { hash } from 'bcryptjs';

// POST: Reset user password (for mobile app)
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    
    if (authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized access. Admin privileges required.' 
      }, { status: 403 });
    }
    
    const params = await props.params;
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid user ID format.' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { password } = body;
    
    // Validate password
    if (!password) {
      return NextResponse.json({ 
        success: false,
        error: 'Password is required.' 
      }, { status: 400 });
    }
    
    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'Password must be at least 6 characters long.' 
      }, { status: 400 });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        authType: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found.' 
      }, { status: 404 });
    }
    
    // Check if user has LOCAL auth type (can't reset password for Google users)
    if (user.authType !== 'LOCAL') {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot reset password for users with external authentication (Google).' 
      }, { status: 400 });
    }
    
    // Hash new password
    const hashedPassword = await hash(password, 12);
    
    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error while resetting password' 
    }, { status: 500 });
  }
}