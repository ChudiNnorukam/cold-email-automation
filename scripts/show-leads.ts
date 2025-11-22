import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showLeads() {
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" },
        include: { template: true }
    });

    if (!campaign) {
        console.log("❌ Campaign 'Modern Redesign Campaign' not found.");
        return;
    }

    console.log("\n📧 --- EMAIL TEMPLATE ---");
    console.log(`Subject: ${campaign.template?.subject}`);
    console.log(`Body:\n${campaign.template?.body}`);
    console.log("-------------------------\n");

    const enrichedLeads = await prisma.lead.findMany({
        where: {
            campaignLeads: {
                some: { campaignId: campaign.id }
            },
            email: { not: { contains: '@placeholder.com' } }
        },
        include: {
            campaignLeads: {
                where: { campaignId: campaign.id }
            }
        }
    });

    const totalLeads = await prisma.lead.count({
        where: {
            campaignLeads: {
                some: { campaignId: campaign.id }
            }
        }
    });

    console.log(`👥 --- ENRICHED LEADS (${enrichedLeads.length} / ${totalLeads} Total) ---`);

    // Show first 10
    enrichedLeads.slice(0, 10).forEach(lead => {
        const scheduled = lead.campaignLeads[0]?.scheduledFor;
        console.log(`🏢 ${lead.company}`);
        console.log(`   🌐 ${lead.website}`);
        console.log(`   📧 ${lead.email}`);
        console.log(`   📅 Scheduled: ${scheduled ? scheduled.toLocaleString() : 'Not Scheduled'}`);
        console.log("");
    });

    if (enrichedLeads.length > 10) {
        console.log(`... and ${enrichedLeads.length - 10} more enriched leads.`);
    }
}

showLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
