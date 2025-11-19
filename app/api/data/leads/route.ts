import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

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

  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      status: true,
    },
    where: {
      status: {
        notIn: ['NOT_INTERESTED'],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(leads, {
    headers: {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': String(limitResult.remaining),
      'X-RateLimit-Reset': new Date(limitResult.resetAt).toISOString(),
    },
  });
}
