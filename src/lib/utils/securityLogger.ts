import { NextRequest } from 'next/server';
import { loggingService } from '@/lib/services/loggingService';
import { extractRequestContext } from './requestHelpers';

export class SecurityLogger {
  static async logSuspiciousActivity(
    request: NextRequest,
    event: string,
    severity: 'low' | 'medium' | 'high',
    userId?: number,
    details?: any
  ) {
    const context = extractRequestContext(request, userId);
    
    await loggingService.logSecurity(
      event,
      severity,
      userId,
      context.ipAddress,
      context.userAgent,
      {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        ...details
      }
    );
  }

  static async logFailedAuthentication(
    request: NextRequest,
    email: string,
    reason: string,
    attemptCount?: number
  ) {
    await this.logSuspiciousActivity(
      request,
      `Failed authentication attempt for ${email}`,
      attemptCount && attemptCount > 3 ? 'high' : 'medium',
      undefined,
      {
        email,
        reason,
        attemptCount,
        authenticationFailure: true
      }
    );
  }

  static async logUnauthorizedAccess(
    request: NextRequest,
    resource: string,
    userId?: number,
    requiredRole?: string
  ) {
    await this.logSuspiciousActivity(
      request,
      `Unauthorized access attempt to ${resource}`,
      'medium',
      userId,
      {
        resource,
        requiredRole,
        unauthorizedAccess: true
      }
    );
  }

  static async logDataAccess(
    request: NextRequest,
    dataType: string,
    entityId: string,
    userId: number,
    action: 'read' | 'write' | 'delete'
  ) {
    await this.logSuspiciousActivity(
      request,
      `Data ${action} access: ${dataType}`,
      'low',
      userId,
      {
        dataType,
        entityId,
        action,
        dataAccess: true
      }
    );
  }

  static async logApiRateLimit(
    request: NextRequest,
    endpoint: string,
    requestCount: number,
    timeWindow: string,
    userId?: number
  ) {
    await this.logSuspiciousActivity(
      request,
      `API rate limit approached for ${endpoint}`,
      requestCount > 100 ? 'high' : 'medium',
      userId,
      {
        endpoint,
        requestCount,
        timeWindow,
        rateLimitEvent: true
      }
    );
  }

  static async logInputValidationFailure(
    request: NextRequest,
    field: string,
    value: any,
    validationRule: string,
    userId?: number
  ) {
    await this.logSuspiciousActivity(
      request,
      `Input validation failure on field: ${field}`,
      'low',
      userId,
      {
        field,
        value: typeof value === 'string' ? value.substring(0, 100) : value,
        validationRule,
        inputValidationFailure: true
      }
    );
  }

  static async logFileUploadSecurity(
    request: NextRequest,
    fileName: string,
    fileSize: number,
    fileType: string,
    securityIssue: string,
    userId: number
  ) {
    await this.logSuspiciousActivity(
      request,
      `File upload security issue: ${securityIssue}`,
      'medium',
      userId,
      {
        fileName,
        fileSize,
        fileType,
        securityIssue,
        fileUploadSecurity: true
      }
    );
  }

  static async logPasswordEvent(
    request: NextRequest,
    event: 'password_changed' | 'password_reset_requested' | 'password_reset_completed',
    userId: number,
    isSuccessful: boolean
  ) {
    await this.logSuspiciousActivity(
      request,
      `Password event: ${event}`,
      isSuccessful ? 'low' : 'medium',
      userId,
      {
        event,
        isSuccessful,
        passwordEvent: true
      }
    );
  }

  static async logPrivilegeEscalation(
    request: NextRequest,
    userId: number,
    fromRole: string,
    toRole: string,
    adminUserId: number
  ) {
    await this.logSuspiciousActivity(
      request,
      `Privilege escalation: ${fromRole} -> ${toRole}`,
      'high',
      userId,
      {
        fromRole,
        toRole,
        adminUserId,
        privilegeEscalation: true
      }
    );
  }
}

export class PerformanceLogger {
  static async logSlowQuery(
    operation: string,
    duration: number,
    query: string,
    parameters?: any,
    userId?: number
  ) {
    await loggingService.logPerformance(
      `Slow Query: ${operation}`,
      duration,
      userId,
      undefined,
      undefined,
      {
        query: query.substring(0, 500), // Truncate long queries
        parameters,
        slowQuery: true,
        threshold: 1000 // ms
      }
    );
  }

  static async logApiEndpointPerformance(
    request: NextRequest,
    duration: number,
    userId?: number,
    additionalMetrics?: {
      dbQueryCount?: number;
      dbQueryTime?: number;
      cacheHits?: number;
      cacheMisses?: number;
    }
  ) {
    const pathname = new URL(request.url).pathname;
    
    await loggingService.logPerformance(
      `API: ${request.method} ${pathname}`,
      duration,
      userId,
      undefined,
      undefined,
      {
        method: request.method,
        url: request.url,
        apiPerformance: true,
        ...additionalMetrics
      }
    );
  }

  static async logFileProcessingPerformance(
    operation: string,
    fileName: string,
    fileSize: number,
    duration: number,
    userId: number
  ) {
    await loggingService.logPerformance(
      `File Processing: ${operation}`,
      duration,
      userId,
      undefined,
      undefined,
      {
        operation,
        fileName,
        fileSize,
        fileProcessing: true
      }
    );
  }

  static async logDatabasePerformance(
    operation: string,
    table: string,
    recordCount: number,
    duration: number,
    userId?: number
  ) {
    await loggingService.logPerformance(
      `Database: ${operation} on ${table}`,
      duration,
      userId,
      undefined,
      undefined,
      {
        operation,
        table,
        recordCount,
        databaseOperation: true
      }
    );
  }
}

// Rate limiting helper
export class RateLimitTracker {
  private static requests = new Map<string, number[]>();

  static checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; requestCount: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    // Add current request
    validRequests.push(now);
    
    return {
      allowed: validRequests.length <= maxRequests,
      requestCount: validRequests.length
    };
  }

  static async logIfNearLimit(
    request: NextRequest,
    identifier: string,
    requestCount: number,
    maxRequests: number,
    userId?: number
  ) {
    const usagePercentage = (requestCount / maxRequests) * 100;
    
    if (usagePercentage >= 80) {
      await SecurityLogger.logApiRateLimit(
        request,
        new URL(request.url).pathname,
        requestCount,
        '1 minute',
        userId
      );
    }
  }
}