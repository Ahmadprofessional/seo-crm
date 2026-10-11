import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, NextAuth API routes, and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token =
    (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'seo-crm-secret-clinic-auth-token-supersecure-2026',
    })) ||
    (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'seo-crm-secret-clinic-auth-token-supersecure-2026',
      secureCookie: false,
    }));


  if (!token) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api')) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Pages redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
