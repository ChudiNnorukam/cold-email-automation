import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateApiKey } from './lib/auth';

/**
 * Middleware for protecting API routes with authentication
 * Runs on all /api/* routes except public endpoints
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public endpoints that don't require authentication
  const publicPaths = ['/api/unsubscribe'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // CRON endpoints require CRON_SECRET header
  if (pathname.startsWith('/api/cron/')) {
    const cronSecret = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || expectedSecret.trim().length === 0) {
      console.error('CRON_SECRET environment variable is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Support both "Bearer <secret>" and raw secret formats
    const providedSecret = cronSecret.startsWith('Bearer ')
      ? cronSecret.slice(7)
      : cronSecret;

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid CRON_SECRET' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // All other API routes require API key authentication
  if (pathname.startsWith('/api/')) {
    const apiKey = request.headers.get('x-api-key');

    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
