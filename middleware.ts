import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Exclude Public Routes
  if (
    pathname.startsWith('/api/cron') || // Protected by CRON_SECRET
    pathname.startsWith('/api/unsubscribe') || // Public for leads
    pathname.startsWith('/_next') || // Next.js internals
    pathname.startsWith('/static') || // Static files
    pathname.startsWith('/assets') || // Public assets
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Basic Auth Check
  const basicAuth = req.headers.get('authorization');
  const user = process.env.ADMIN_USER || 'admin';
  const pwd = process.env.ADMIN_PASSWORD || 'admin';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [u, p] = atob(authValue).split(':');

    if (u === user && p === pwd) {
      return NextResponse.next();
    }
  }

  // 3. Challenge
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
    },
  });
}

export const config = {
  matcher: '/:path*',
};
