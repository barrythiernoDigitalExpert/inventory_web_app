// src/app/api/mobile/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';
import { hash } from 'bcryptjs';
import { UserRole } from '@prisma/client';

// GET: List all users (for mobile app)
export async function GET(request: NextRequest) {
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
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        authType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          authType: user.authType,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        })),
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error while fetching users' 
    }, { status: 500 });
  }
}

// POST: Create a new user (for mobile app)
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { name, email, password, role } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields. Name, email, and password are required.' 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email format.' 
      }, { status: 400 });
    }
    
    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'Password must be at least 6 characters long.' 
      }, { status: 400 });
    }
    
    // Validate role
    const validRoles = ['ADMIN', 'USER'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid role. Must be either ADMIN or USER.' 
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'A user with this email already exists.' 
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER,
        isActive: true,
        authType: 'LOCAL'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        authType: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          authType: newUser.authType,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString()
        }
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error while creating user' 
    }, { status: 500 });
  }
}