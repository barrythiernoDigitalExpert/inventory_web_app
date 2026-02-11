/**
 * Hybrid Authentication Utility
 * ----------------------------
 * Supports both NextAuth session (web) and JWT token (mobile) authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyJwtAuth } from './auth-jwt';
import { prisma } from './prisma';

export async function verifyAuth(request: NextRequest) {
  // Try NextAuth session first (for web clients)
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      // Fetch full user from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (!user) {
        return {
          error: NextResponse.json({
            success: false,
            error: 'User not found'
          }, { status: 404 })
        };
      }

      if (!user.isActive) {
        return {
          error: NextResponse.json({
            success: false,
            error: 'Account inactive'
          }, { status: 403 })
        };
      }

      return { user };
    }
  } catch (error) {
    console.log('NextAuth session not found, trying JWT...');
  }

  // Fall back to JWT authentication (for mobile clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return await verifyJwtAuth(request);
  }

  // No valid authentication found
  return {
    error: NextResponse.json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 })
  };
}
