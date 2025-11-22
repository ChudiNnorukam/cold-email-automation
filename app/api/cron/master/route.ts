import { NextResponse } from 'next/server';
import { findNewLeads, processEmailQueue } from '@/lib/cron-services';

export const maxDuration = 60; // Vercel Hobby limit is 10s, Pro is 60s. We'll try to keep it fast.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log("Starting Master Cron Job...");
        const results: any = {};

        // 1. Find New Leads
        try {
            console.log("Running findNewLeads...");
            const leadResult = await findNewLeads();
            results.leads = leadResult;
        } catch (error: any) {
            console.error("findNewLeads failed:", error);
            results.leads = { error: error.message };
        }

        // 2. Process Email Queue
        try {
            console.log("Running processEmailQueue...");
            const emailResult = await processEmailQueue();
            results.emails = emailResult;
        } catch (error: any) {
            console.error("processEmailQueue failed:", error);
            results.emails = { error: error.message };
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error: any) {
        console.error('Master Cron job failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
