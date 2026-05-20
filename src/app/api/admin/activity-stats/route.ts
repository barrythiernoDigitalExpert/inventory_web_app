import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth';
import { prisma } from '@/lib/utils/prisma';
import { UserRole, ActivityType } from '@/generated/prisma';
import { loggingService } from '@/lib/services/loggingService';

// Helper function to convert BigInt to Number
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const activityType = searchParams.get('activityType') as ActivityType;

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Get activity statistics
    const rawStats = await loggingService.getActivityStats(
      start,
      end,
      userId ? parseInt(userId) : undefined,
      activityType
    );
    const stats = convertBigIntToNumber(rawStats);

    // Get additional metrics
    const [
      topUsers,
      activityTrends,
      recentActivities
    ] = await Promise.all([
      // Top 10 most active users
      prisma.userActivity.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),

      // Activity trends by day
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          activity_type as activityType,
          COUNT(*) as count
        FROM user_activities 
        WHERE timestamp >= ${start} AND timestamp <= ${end}
        GROUP BY DATE(timestamp), activity_type
        ORDER BY date DESC
      `,

      // Recent activities with user details
      prisma.userActivity.findMany({
        where: {
          timestamp: {
            gte: start,
            lte: end
          },
          ...(userId && { userId: parseInt(userId) }),
          ...(activityType && { activityType })
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      })
    ]);

    // Get user details for top users
    const userIds = topUsers.map(u => u.userId);
    const userDetails = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    const topUsersWithDetails = topUsers.map(userStat => {
      const userDetail = userDetails.find(u => u.id === userStat.userId);
      return {
        ...userStat,
        user: userDetail
      };
    });

    // Calculate summary metrics
    const totalActivities = stats.totalActivities;
    const uniqueUsers = new Set(stats.activities.map((a: any) => a.userId)).size;
    const avgActivitiesPerUser = uniqueUsers > 0 ? totalActivities / uniqueUsers : 0;

    const response = {
      summary: {
        totalActivities,
        uniqueUsers,
        avgActivitiesPerUser: Math.round(avgActivitiesPerUser * 100) / 100,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      },
      activityBreakdown: stats.activityBreakdown,
      topUsers: convertBigIntToNumber(topUsersWithDetails),
      activityTrends: convertBigIntToNumber(activityTrends),
      recentActivities: convertBigIntToNumber(recentActivities),
      filters: {
        userId,
        activityType,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate, userIds, activityTypes } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate detailed report
    const activities = await prisma.userActivity.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end
        },
        ...(userIds && userIds.length > 0 && {
          userId: {
            in: userIds.map((id: string) => parseInt(id))
          }
        }),
        ...(activityTypes && activityTypes.length > 0 && {
          activityType: {
            in: activityTypes
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Group by user and activity type
    const userActivityMap = new Map();
    
    activities.forEach(activity => {
      const key = `${activity.userId}-${activity.activityType}`;
      if (!userActivityMap.has(key)) {
        userActivityMap.set(key, {
          user: activity.user,
          activityType: activity.activityType,
          count: 0,
          lastActivity: activity.timestamp,
          activities: []
        });
      }
      
      const entry = userActivityMap.get(key);
      entry.count += 1;
      entry.activities.push(activity);
    });

    const detailedReport = Array.from(userActivityMap.values());

    return NextResponse.json({
      report: convertBigIntToNumber(detailedReport),
      totalActivities: activities.length,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Activity report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate activity report' },
      { status: 500 }
    );
  }
}