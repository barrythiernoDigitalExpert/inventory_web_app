import { NextRequest } from 'next/server';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
  deviceType?: string;
}

export function extractRequestContext(request: NextRequest, userId?: number): RequestContext {
  const ipAddress = (request as any).ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const deviceType = getDeviceType(userAgent);

  return {
    ipAddress,
    userAgent,
    userId,
    deviceType
  };
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'mobile';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  if (ua.includes('electron')) {
    return 'desktop_app';
  }
  
  return 'desktop';
}

export function createPerformanceTimer() {
  const startTime = Date.now();
  
  return {
    end: () => Date.now() - startTime
  };
}

export function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  return data;
}