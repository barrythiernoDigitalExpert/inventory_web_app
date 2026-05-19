import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/reset-password', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // API routes using JWT Bearer are protected at the handler level — skip middleware
  const isApiRoute = pathname.startsWith('/api/');

  // Allow public paths, static assets and JWT-protected API routes
  if (isPublicPath ||
      isApiRoute ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/images') ||
      pathname.includes('favicon.ico')) {
    return NextResponse.next();
  }

  // Check for the session token (web pages only)
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Redirect to login if there's no session
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ],
};