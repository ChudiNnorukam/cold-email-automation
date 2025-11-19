import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
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

  return NextResponse.json(leads);
}
