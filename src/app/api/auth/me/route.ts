// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user!;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
