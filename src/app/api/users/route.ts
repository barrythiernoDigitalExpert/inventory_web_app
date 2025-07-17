// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { hash } from 'bcryptjs';
import { UserRole, ActivityType, EntityType } from '@prisma/client';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from '@/lib/utils/requestHelpers';

// GET: Fetch all users
export async function GET(request: NextRequest) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all users with property counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isActive:true,
        _count: {
          select: {
            properties: true,
            sharedProperties: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Log admin users view
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (adminUser) {
      const duration = Date.now() - startTime;
      await loggingService.logActivity(
        adminUser.id,
        ActivityType.LOGIN, // Ou ActivityType.VIEW_PROPERTY selon ce qui est approprié
        EntityType.USER,
        undefined,
        {
          usersCount: users.length,
          adminAction: 'users_list_view'
        },
        context.deviceType,
        duration
      );
    }
    
    return NextResponse.json({
      users: users.map(user => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        propertiesCount: user._count.properties,
        sharedCount: user._count.sharedProperties
      }))
    });
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'users/GET',
      undefined,
      context
    );
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  const context = extractRequestContext(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { name, email, role, password } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER,
        isActive: true,
      }
    });

    // Log user creation activity
    await loggingService.logActivity(
      adminUser.id,
      ActivityType.CREATE_USER,
      EntityType.USER,
      user.id.toString(),
      {
        createdUserEmail: email,
        createdUserRole: user.role,
        createdUserName: name
      },
      context.deviceType
    );
    
    return NextResponse.json({
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'users/create',
      context.userId,
      { 
        ipAddress: context.ipAddress, 
        userAgent: context.userAgent,
        attemptedEmail: request.body ? JSON.parse(await request.text()).email : 'unknown'
      }
    );
    
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}