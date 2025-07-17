import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext, createPerformanceTimer } from '@/lib/utils/requestHelpers';
import { ActivityType, EntityType } from '@prisma/client';
import { prisma } from '@/lib/utils/prisma';

export interface LoggingOptions {
  activityType?: ActivityType;
  entityType?: EntityType;
  skipLogging?: boolean;
  logPerformance?: boolean;
  operationName?: string;
}

export function withLogging(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: LoggingOptions = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const timer = options.logPerformance ? createPerformanceTimer() : null;
    const context = extractRequestContext(request);
    let userId: number | undefined;
    let response: NextResponse;

    try {
      // Get user session if available
      if (!options.skipLogging) {
        try {
          const session = await getServerSession(authOptions);
          if (session?.user?.email) {
            const user = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true }
            });
            userId = user?.id;
            context.userId = userId;
          }
        } catch (sessionError) {
          // Continue without user context if session fails
        }
      }

      // Execute the handler
      response = await handler(request, ...args);

      // Log successful operation
      if (!options.skipLogging && options.activityType && userId) {
        const entityId = extractEntityId(request, response);
        
        await loggingService.logActivity(
          userId,
          options.activityType,
          options.entityType || EntityType.SYSTEM,
          entityId,
          {
            method: request.method,
            url: request.url,
            status: response.status,
            userAgent: context.userAgent,
            ipAddress: context.ipAddress
          },
          context.deviceType,
          timer ? timer.end() : undefined
        );
      }

      // Log performance if enabled
      if (options.logPerformance && timer && userId) {
        const duration = timer.end();
        await loggingService.logPerformance(
          options.operationName || `${request.method} ${extractPathname(request.url)}`,
          duration,
          userId,
          options.entityType,
          extractEntityId(request, response)
        );
      }

      return response;

    } catch (error) {
      // Log error
      await loggingService.logError(
        error as Error,
        options.operationName || `${request.method} ${extractPathname(request.url)}`,
        userId,
        {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          method: request.method,
          url: request.url
        }
      );

      throw error; // Re-throw to maintain error handling
    }
  };
}

function extractEntityId(request: NextRequest, response?: NextResponse): string | undefined {
  try {
    // Extract from URL path parameters
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    
    // Look for common ID patterns in URL
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      if (segment && !isNaN(Number(segment))) {
        return segment;
      }
      // Look for CUID patterns
      if (segment && segment.match(/^[a-z0-9]{25}$/)) {
        return segment;
      }
    }

    // Try to extract from response body if available
    if (response) {
      try {
        // This would need to be implemented based on response structure
        // For now, return undefined
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

function extractPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch (error) {
    return url;
  }
}

// Decorator for easy use with API routes
export function loggedRoute(options: LoggingOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = withLogging(originalMethod, options);
    
    return descriptor;
  };
}

// Helper function to determine activity type from HTTP method and path
export function getActivityTypeFromRequest(request: NextRequest): ActivityType | undefined {
  const method = request.method;
  const pathname = new URL(request.url).pathname;

  if (pathname.includes('/users')) {
    switch (method) {
      case 'POST': return ActivityType.CREATE_USER;
      case 'PUT':
      case 'PATCH': return ActivityType.EDIT_USER;
      case 'DELETE': return ActivityType.DELETE_USER;
    }
  }

  if (pathname.includes('/properties')) {
    switch (method) {
      case 'POST': return ActivityType.CREATE_PROPERTY;
      case 'PUT':
      case 'PATCH': return ActivityType.EDIT_PROPERTY;
      case 'DELETE': return ActivityType.DELETE_PROPERTY;
      case 'GET': return ActivityType.VIEW_PROPERTY;
    }
  }

  if (pathname.includes('/rooms')) {
    switch (method) {
      case 'POST': return ActivityType.ADD_ROOM;
      case 'PUT':
      case 'PATCH': return ActivityType.EDIT_ROOM;
      case 'DELETE': return ActivityType.DELETE_ROOM;
    }
  }

  if (pathname.includes('/images')) {
    switch (method) {
      case 'POST': return ActivityType.ADD_IMAGE;
      case 'DELETE': return ActivityType.DELETE_IMAGE;
      case 'PUT':
      case 'PATCH': return ActivityType.EDIT_IMAGE;
    }
  }

  if (pathname.includes('/login')) {
    return ActivityType.LOGIN;
  }

  if (pathname.includes('/password')) {
    return ActivityType.CHANGE_PASSWORD;
  }

  return undefined;
}

// Helper to get entity type from request path
export function getEntityTypeFromRequest(request: NextRequest): EntityType | undefined {
  const pathname = new URL(request.url).pathname;

  if (pathname.includes('/users')) return EntityType.USER;
  if (pathname.includes('/properties')) return EntityType.PROPERTY;
  if (pathname.includes('/rooms')) return EntityType.ROOM;
  if (pathname.includes('/images')) return EntityType.IMAGE;
  if (pathname.includes('/canvassing')) return EntityType.CANVASSING_VISIT;

  return EntityType.SYSTEM;
}