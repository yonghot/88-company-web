import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin-auth');
    const adminPassword = process.env.ADMIN_PASSWORD || '159753';

    if (!authCookie || authCookie.value !== adminPassword) {
      const url = new URL('/admin-login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};