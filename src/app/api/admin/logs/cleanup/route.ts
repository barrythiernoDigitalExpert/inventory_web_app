// src/app/api/admin/logs/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { ActivityType, EntityType } from '@prisma/client';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from '@/lib/utils/requestHelpers';

// Configuration for log retention
const LOG_RETENTION_CONFIG = {
  // Keep logs for different periods based on type
  activity: 90, // 3 months for user activities
  error: 180, // 6 months for errors
  security: 365, // 1 year for security events
  performance: 30, // 1 month for performance logs
  auth: 180, // 6 months for authentication logs
};

export async function POST(request: NextRequest) {
  const context = extractRequestContext(request);
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    
    const { dryRun = false, retentionDays } = await request.json();
    
    let cleanupResults = {
      deletedActivities: 0,
      oldestKeptDate: new Date(),
      summary: {} as Record<string, number>
    };
    
    if (retentionDays && typeof retentionDays === 'number') {
      // Custom retention period provided
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      if (dryRun) {
        const count = await prisma.userActivity.count({
          where: {
            timestamp: {
              lt: cutoffDate
            }
          }
        });
        cleanupResults.deletedActivities = count;
      } else {
        const result = await prisma.userActivity.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate
            }
          }
        });
        cleanupResults.deletedActivities = result.count;
      }
      
      cleanupResults.oldestKeptDate = cutoffDate;
    } else {
      // Use default retention policy based on activity type
      for (const [activityCategory, retentionDays] of Object.entries(LOG_RETENTION_CONFIG)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        let whereCondition: any = {
          timestamp: {
            lt: cutoffDate
          }
        };
        
        // Apply specific filters based on category
        switch (activityCategory) {
          case 'error':
            // Look for error-related activities in metadata
            whereCondition.OR = [
              { details: { contains: '"error"' } },
              { details: { contains: '"exception"' } },
              { details: { contains: '"failure"' } }
            ];
            break;
          case 'security':
            whereCondition.OR = [
              { activityType: ActivityType.LOGIN },
              { activityType: ActivityType.LOGOUT },
              { details: { contains: '"securityEvent"' } }
            ];
            break;
          case 'performance':
            whereCondition.details = { contains: '"performance"' };
            break;
          case 'auth':
            whereCondition.activityType = {
              in: [ActivityType.LOGIN, ActivityType.LOGOUT]
            };
            break;
          default:
            // For general activities, just use timestamp
            break;
        }
        
        if (dryRun) {
          const count = await prisma.userActivity.count({
            where: whereCondition
          });
          cleanupResults.summary[activityCategory] = count;
        } else {
          const result = await prisma.userActivity.deleteMany({
            where: whereCondition
          });
          cleanupResults.summary[activityCategory] = result.count;
          cleanupResults.deletedActivities += result.count;
        }
      }
    }
    
    // Get remaining log statistics
    const remainingStats = await prisma.userActivity.groupBy({
      by: ['activityType'],
      _count: {
        id: true
      }
    });
    
    const totalRemaining = await prisma.userActivity.count();
    
    // Log the cleanup operation
    const duration = Date.now() - startTime;
    await loggingService.logActivity(
      adminUser.id,
      ActivityType.DELETE_PROPERTY,
      EntityType.SYSTEM,
      'log_cleanup',
      {
        dryRun,
        deletedCount: cleanupResults.deletedActivities,
        retentionDays: retentionDays || 'policy-based',
        summary: cleanupResults.summary,
        remainingLogs: totalRemaining
      },
      context.deviceType,
      duration
    );
    
    return NextResponse.json({
      success: true,
      dryRun,
      deletedLogs: cleanupResults.deletedActivities,
      summary: cleanupResults.summary,
      remainingLogs: totalRemaining,
      remainingByType: remainingStats,
      oldestKeptDate: cleanupResults.oldestKeptDate,
      retentionPolicy: retentionDays ? `${retentionDays} days` : LOG_RETENTION_CONFIG
    });
    
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'admin/logs/cleanup',
      undefined,
      context
    );
    
    console.error('Error during log cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup logs' },
      { status: 500 }
    );
  }
}

// GET: Show log cleanup status and statistics
export async function GET(request: NextRequest) {
  const context = extractRequestContext(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    // Get log statistics
    const totalLogs = await prisma.userActivity.count();
    
    const logsByType = await prisma.userActivity.groupBy({
      by: ['activityType'],
      _count: {
        id: true
      }
    });
    
    const logsByDate = await prisma.userActivity.groupBy({
      by: ['timestamp'],
      _count: {
        id: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 30 // Last 30 entries to see date distribution
    });
    
    // Calculate what would be deleted with current retention policy
    const potentialCleanup: Record<string, number> = {};
    for (const [category, retentionDays] of Object.entries(LOG_RETENTION_CONFIG)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let whereCondition: any = {
        timestamp: {
          lt: cutoffDate
        }
      };
      
      const count = await prisma.userActivity.count({
        where: whereCondition
      });
      
      potentialCleanup[category] = count;
    }
    
    // Get oldest and newest log dates
    const oldestLog = await prisma.userActivity.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    });
    
    const newestLog = await prisma.userActivity.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });
    
    return NextResponse.json({
      totalLogs,
      logsByType,
      dateRange: {
        oldest: oldestLog?.timestamp,
        newest: newestLog?.timestamp
      },
      retentionPolicy: LOG_RETENTION_CONFIG,
      potentialCleanup,
      totalPotentialCleanup: Object.values(potentialCleanup).reduce((sum, count) => sum + count, 0)
    });
    
  } catch (error) {
    await loggingService.logError(
      error as Error,
      'admin/logs/cleanup/GET',
      undefined,
      context
    );
    
    console.error('Error fetching log cleanup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log status' },
      { status: 500 }
    );
  }
}