
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- Starting Diagnosis ---');

    // 1. Check SMTP Config
    const smtp = await prisma.smtpConfig.findFirst();
    if (!smtp) {
        console.error('❌ CRITICAL: No SMTP Configuration found!');
    } else {
        console.log('✅ SMTP Config found.');
        console.log(`   - User: ${smtp.user}`);
        console.log(`   - Daily Limit: ${smtp.dailyLimit}`);
        console.log(`   - Sent Today: ${smtp.sentToday}`);
        console.log(`   - Last Reset: ${smtp.lastResetDate}`);

        if (smtp.sentToday >= smtp.dailyLimit) {
            console.warn('⚠️ WARNING: Daily limit reached.');
        }
    }

    // 2. Check Campaigns
    const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        include: { sequence: true }
    });
    console.log(`\n--- Campaigns ---`);
    console.log(`Found ${activeCampaigns.length} ACTIVE campaigns.`);

    for (const camp of activeCampaigns) {
        console.log(`   - Campaign: ${camp.name} (ID: ${camp.id})`);
        console.log(`     - Sequence: ${camp.sequence?.name || 'None (Legacy)'}`);

        // Check Leads in this campaign
        const leads = await prisma.campaignLead.findMany({
            where: { campaignId: camp.id }
        });

        const queued = leads.filter(l => l.status === 'QUEUED').length;
        const sent = leads.filter(l => l.status === 'SENT').length;
        const failed = leads.filter(l => l.status === 'FAILED').length;
        const completed = leads.filter(l => l.status === 'COMPLETED').length;

        console.log(`     - Leads: Total ${leads.length} | Queued: ${queued} | Sent: ${sent} | Failed: ${failed} | Completed: ${completed}`);

        // Check for eligible leads (logic from cron)
        const eligible = await prisma.campaignLead.findMany({
            where: {
                campaignId: camp.id,
                lead: { status: { not: 'REPLIED' } },
                OR: [
                    { status: 'QUEUED' },
                    {
                        status: 'SENT',
                        nextStepAt: { lte: new Date() }
                    }
                ]
            }
        });
        console.log(`     - ELIGIBLE FOR CRON: ${eligible.length}`);
        if (eligible.length > 0) {
            console.log(`       - Sample Eligible Lead: ${eligible[0].id} (Status: ${eligible[0].status}, NextStepAt: ${eligible[0].nextStepAt})`);
        }
    }

    // 3. Check Global Leads
    const totalLeads = await prisma.lead.count();
    console.log(`\n--- Global Leads ---`);
    console.log(`Total Leads in DB: ${totalLeads}`);

    console.log('\n--- Diagnosis Complete ---');
}

diagnose()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
