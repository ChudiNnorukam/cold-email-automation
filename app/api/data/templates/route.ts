import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Apply rate limiting: 20 requests per 10 seconds per IP
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limitResult = rateLimit(ip, 20, 10000);

  if (!limitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((limitResult.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limitResult.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': String(limitResult.remaining),
          'X-RateLimit-Reset': new Date(limitResult.resetAt).toISOString(),
        },
      }
    );
  }

  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      subject: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates, {
    headers: {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': String(limitResult.remaining),
      'X-RateLimit-Reset': new Date(limitResult.resetAt).toISOString(),
    },
  });
}
