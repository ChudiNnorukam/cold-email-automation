import { NextRequest, NextResponse } from 'next/server';
import { GET as sendEmails } from '../send-emails/route';
import { GET as findLeads } from '../find-leads/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { job } = await req.json();

        if (job === 'send-emails') {
            return await sendEmails(req);
        } else if (job === 'find-leads') {
            return await findLeads(req);
        } else {
            return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
