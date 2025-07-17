import { prisma } from '@/lib/utils/prisma';
import { ActivityType, EntityType } from '@prisma/client';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogData {
  level: LogLevel;
  message: string;
  userId?: number;
  entityId?: string;
  entityType?: EntityType;
  activityType?: ActivityType;
  details?: any;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class LoggingService {
  private shouldLog(level: LogLevel): boolean {
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = logLevels.indexOf(process.env.LOG_LEVEL as LogLevel || LogLevel.INFO);
    const requestedLevelIndex = logLevels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private async consoleLog(data: LogData): Promise<void> {
    if (!this.shouldLog(data.level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: data.level,
      message: data.message,
      userId: data.userId,
      entityId: data.entityId,
      entityType: data.entityType,
      activityType: data.activityType,
      details: data.details,
      metadata: data.metadata
    };

    switch (data.level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry, null, 2));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry, null, 2));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry, null, 2));
        break;
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry, null, 2));
        break;
    }
  }

  private async saveToDatabase(data: LogData): Promise<void> {
    if (!data.userId || !data.activityType) return;

    try {
      await prisma.userActivity.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          entityId: data.entityId,
          entityType: data.entityType,
          details: data.details ? JSON.stringify(data.details) : null,
          deviceType: data.deviceType,
          duration: data.duration,
          timestamp: new Date(),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });
    } catch (error) {
      console.error('Failed to save activity to database:', error);
    }
  }

  async log(data: LogData): Promise<void> {
    await Promise.all([
      this.consoleLog(data),
      this.saveToDatabase(data)
    ]);
  }

  async logActivity(
    userId: number,
    activityType: ActivityType,
    entityType: EntityType,
    entityId?: string,
    details?: any,
    deviceType?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message: `User ${userId} performed ${activityType} on ${entityType}${entityId ? ` (${entityId})` : ''}`,
      userId,
      activityType,
      entityType,
      entityId,
      details,
      deviceType,
      duration,
      metadata
    });
  }

  async logAuth(
    userId: number,
    activityType: ActivityType,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.log({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      message: `Authentication ${activityType} ${success ? 'successful' : 'failed'} for user ${userId}`,
      userId,
      activityType,
      entityType: EntityType.USER,
      entityId: userId.toString(),
      details: {
        success,
        ipAddress,
        userAgent,
        ...details
      },
      metadata: {
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logError(
    error: Error,
    context?: string,
    userId?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      message: `Error in ${context || 'unknown context'}: ${error.message}`,
      userId,
      details: {
        error: error.message,
        stack: error.stack,
        context
      },
      metadata: {
        errorName: error.name,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  async logPerformance(
    operation: string,
    duration: number,
    userId?: number,
    entityType?: EntityType,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message: `Performance: ${operation} completed in ${duration}ms`,
      userId,
      entityType,
      entityId,
      duration,
      details: {
        operation,
        duration,
        performance: true
      },
      metadata: {
        performanceMetric: true,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  async logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high',
    userId?: number,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    const level = severity === 'high' ? LogLevel.ERROR : 
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    await this.log({
      level,
      message: `Security Event [${severity.toUpperCase()}]: ${event}`,
      userId,
      details: {
        securityEvent: true,
        severity,
        ipAddress,
        userAgent,
        ...details
      },
      metadata: {
        securityAlert: true,
        severity,
        timestamp: new Date().toISOString()
      }
    });
  }

  async getActivityStats(
    startDate: Date,
    endDate: Date,
    userId?: number,
    activityType?: ActivityType
  ): Promise<any> {
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (activityType) {
      whereClause.activityType = activityType;
    }

    const [activities, stats] = await Promise.all([
      prisma.userActivity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      }),
      prisma.userActivity.groupBy({
        by: ['activityType'],
        where: whereClause,
        _count: {
          id: true
        }
      })
    ]);

    const userStats = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    return {
      totalActivities: activities.length,
      activities,
      activityBreakdown: stats,
      userBreakdown: userStats,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  }
}

export const loggingService = new LoggingService();