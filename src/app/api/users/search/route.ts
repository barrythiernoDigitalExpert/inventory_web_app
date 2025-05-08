// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the session to check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the search query parameter
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    
    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Invalid search query' }, { status: 400 });
    }
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 10, // Limit results
    });

    // Remove the current user from the results
    const filteredUsers = users.filter(user => user.email !== session.user.email);

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}