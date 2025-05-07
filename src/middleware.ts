import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/reset-password', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Allow public paths and static assets
  if (isPublicPath || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/images') || 
      pathname.includes('favicon.ico')) {
    return NextResponse.next();
  }

  // Check for the session token
  const session = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect to login if there's no session
//   if (!session) {
//     const url = new URL('/login', request.url);
//     url.searchParams.set('callbackUrl', encodeURI(pathname));
//     return NextResponse.redirect(url);
//   }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ],
};