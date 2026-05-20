// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ActivityType, EntityType } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from '@/lib/utils/requestHelpers';
import { prisma } from '@/lib/utils/prisma';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST(request: NextRequest) {
  const context = extractRequestContext(request);
  
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await loggingService.logSecurity(
        `Failed login attempt for email: ${email}`,
        'medium',
        undefined,
        context.ipAddress,
        context.userAgent,
        { email, reason: 'user_not_found' }
      );
      
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      await loggingService.logSecurity(
        `Login attempt on inactive account: ${email}`,
        'high',
        user.id,
        context.ipAddress,
        context.userAgent,
        { email, reason: 'account_inactive' }
      );
      
      return NextResponse.json(
        { message: 'Account is inactive. Please contact administration.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password || '');
    if (!passwordMatch) {
      await loggingService.logAuth(
        user.id,
        ActivityType.LOGIN,
        false,
        context.ipAddress,
        context.userAgent,
        { email, reason: 'invalid_password' }
      );
      
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Log successful login
    await loggingService.logAuth(
      user.id,
      ActivityType.LOGIN,
      true,
      context.ipAddress,
      context.userAgent,
      { 
        email, 
        deviceType: context.deviceType,
        tokenExpiry: '7d'
      }
    );

    // Return user data (excluding password) and token
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      },
      token,
    });
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'auth/login',
      undefined,
      { ipAddress: context.ipAddress, userAgent: context.userAgent }
    );
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}