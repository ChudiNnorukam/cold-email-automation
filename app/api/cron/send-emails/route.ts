import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/cron-services';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const result = await processEmailQueue();
    return NextResponse.json(result, { status: result.status });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
