import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { prisma } from '@/lib/utils/prisma';
import { verifyJwtAuth } from '@/lib/utils/auth-jwt';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJwtAuth(request)
           if (authResult.error) {
             return authResult.error
           }
       
           const user = authResult.user

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get all visits with user information
    const visits = await prisma.canvassingVisit.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group visits by user
    const visitsByUser: Record<string, any[]> = {};
    const userStats: Record<string, any> = {};

    visits.forEach(visit => {
      const userId = visit.userId.toString();
      
      if (!visitsByUser[userId]) {
        visitsByUser[userId] = [];
      }
      visitsByUser[userId].push(visit);
    });

    // Calculate stats for each user
    for (const [userId, userVisits] of Object.entries(visitsByUser)) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const todayVisits = userVisits.filter(v => 
        new Date(v.createdAt) >= todayStart && new Date(v.createdAt) < todayEnd
      ).length;

      const responded = userVisits.filter(v => v.responseReceived !== null).length;
      const responseRate = userVisits.length > 0 ? (responded / userVisits.length * 100) : 0;

      userStats[userId] = {
        userName: userVisits[0]?.user?.name || 'Unknown',
        totalVisits: userVisits.length,
        todayVisits,
        responseRate: Math.round(responseRate * 10) / 10,
        positiveResponses: userVisits.filter(v => v.responseReceived === 'POSITIVE').length,
        negativeResponses: userVisits.filter(v => v.responseReceived === 'NEGATIVE').length,
        pendingResponses: userVisits.filter(v => v.responseReceived === null).length,
        lastActivity: userVisits.length > 0 ? 
          userVisits.reduce((latest, visit) => 
            new Date(visit.createdAt) > new Date(latest.createdAt) ? visit : latest
          ).createdAt : null
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        visitsByUser,
        userStats,
        totalUsers: Object.keys(visitsByUser).length,
        totalVisits: visits.length
      }
    });

  } catch (error) {
    console.error('Error getting visits by users:', error);
    return NextResponse.json(
      { error: 'Failed to get visits by users' },
      { status: 500 }
    );
  }
}