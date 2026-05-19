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
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const dateWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get all users who have canvassing visits
    const usersWithVisits = await prisma.canvassingVisitUser.findMany({
      where: dateWhere.createdAt
        ? { visit: { createdAt: dateWhere.createdAt } }
        : {},
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = usersWithVisits.map(u => u.userId);
    const totalUsers = userIds.length;

    // Paginate the user list
    const paginatedUserIds = userIds.slice(offset, offset + limit);

    // Fetch aggregate stats per user in parallel (one Promise.all, no per-user loops)
    const [usersInfo, visitAggregates] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: paginatedUserIds } },
        select: { id: true, name: true, email: true }
      }),
      Promise.all(paginatedUserIds.map(uid =>
        Promise.all([
          prisma.canvassingVisit.count({ where: { ...dateWhere, visitUsers: { some: { userId: uid } } } }),
          prisma.canvassingVisit.count({ where: { ...dateWhere, visitUsers: { some: { userId: uid } }, createdAt: { gte: todayStart } } }),
          prisma.canvassingVisit.count({ where: { ...dateWhere, visitUsers: { some: { userId: uid } }, responseReceived: 'positive' } }),
          prisma.canvassingVisit.count({ where: { ...dateWhere, visitUsers: { some: { userId: uid } }, responseReceived: 'negative' } }),
          prisma.canvassingVisit.count({ where: { ...dateWhere, visitUsers: { some: { userId: uid } }, responseReceived: null } }),
          prisma.canvassingVisit.findFirst({ where: { ...dateWhere, visitUsers: { some: { userId: uid } } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
        ])
      ))
    ]);

    const userMap = new Map(usersInfo.map(u => [u.id, u]));
    const userStats: Record<string, any> = {};

    paginatedUserIds.forEach((uid, i) => {
      const [total, todayCount, positive, negative, pending, lastVisit] = visitAggregates[i];
      const responded = positive + negative;
      const u = userMap.get(uid);
      userStats[uid.toString()] = {
        userName: u?.name ?? 'Unknown',
        userEmail: u?.email ?? '',
        totalVisits: total,
        todayVisits: todayCount,
        responseRate: total > 0 ? Math.round((responded / total) * 1000) / 10 : 0,
        positiveResponses: positive,
        negativeResponses: negative,
        pendingResponses: pending,
        lastActivity: lastVisit?.createdAt ?? null
      };
    });

    // Recent visits (max 50 per user) — loaded once for all paginated users
    const visits = await prisma.canvassingVisit.findMany({
      where: { ...dateWhere, visitUsers: { some: { userId: { in: paginatedUserIds } } } },
      select: {
        id: true, houseName: true, contactMethod: true,
        responseReceived: true, createdAt: true, latitude: true, longitude: true,
        visitUsers: { select: { userId: true, userName: true, isCreator: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 * paginatedUserIds.length
    });

    const visitsByUser: Record<string, any[]> = {};
    visits.forEach(visit => {
      visit.visitUsers.forEach(vu => {
        if (!paginatedUserIds.includes(vu.userId)) return;
        const uid = vu.userId.toString();
        if (!visitsByUser[uid]) visitsByUser[uid] = [];
        if (visitsByUser[uid].length < 50) visitsByUser[uid].push(visit);
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        visitsByUser,
        userStats,
        totalUsers,
        pagination: { limit, offset, hasMore: offset + limit < totalUsers }
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