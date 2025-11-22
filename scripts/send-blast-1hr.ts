import { PrismaClient } from '@prisma/client';
import { processEmailQueue } from '../lib/cron-services';

const prisma = new PrismaClient();

async function sendBlast() {
    console.log("🚀 Starting 1-Hour Email Blast...");

    // 1. Find Enriched Leads for Modern Redesign Campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" }
    });

    if (!campaign) {
        console.error("❌ Campaign not found.");
        return;
    }

    const enrichedLeads = await prisma.campaignLead.findMany({
        where: {
            campaignId: campaign.id,
            status: 'QUEUED',
            lead: {
                email: { not: { contains: '@placeholder.com' } }
            }
        },
        include: { lead: true }
    });

    console.log(`🎯 Found ${enrichedLeads.length} enriched leads to send.`);

    if (enrichedLeads.length === 0) {
        console.log("✅ No emails to send.");
        return;
    }

    // Calculate delay: 1 hour (3600s) / count
    // Subtract a buffer to be safe
    const delaySeconds = Math.floor(3600 / enrichedLeads.length);
    console.log(`⏳ Sending 1 email every ~${delaySeconds} seconds.`);

    for (let i = 0; i < enrichedLeads.length; i++) {
        const item = enrichedLeads[i];
        console.log(`\n[${i + 1}/${enrichedLeads.length}] Preparing to send to ${item.lead.email}...`);

        // 1. Update scheduledFor to PAST (1 min ago) to ensure it's picked up
        const oneMinAgo = new Date(Date.now() - 60000);
        await prisma.campaignLead.update({
            where: { id: item.id },
            data: { scheduledFor: oneMinAgo }
        });

        // 2. Trigger the queue processor
        // It will pick up any due leads (which should be just this one, plus any others we set previously if they failed)
        const result = await processEmailQueue();

        if (result.results && result.results.length > 0) {
            console.log(`✅ Result:`, result.results[0]);
        } else {
            console.log(`⚠️ No email sent? Check logs.`);
        }

        // 3. Wait for next slot (unless it's the last one)
        if (i < enrichedLeads.length - 1) {
            console.log(`💤 Waiting ${delaySeconds}s...`);
            await new Promise(r => setTimeout(r, delaySeconds * 1000));
        }
    }

    console.log("\n🎉 Blast Complete!");
}

sendBlast()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
