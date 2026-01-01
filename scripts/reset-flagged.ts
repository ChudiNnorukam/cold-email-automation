import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetFlaggedLeads() {
    console.log("🔄 Resetting FLAGGED leads to QUEUED...");

    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" }
    });

    if (!campaign) return;

    const result = await prisma.campaignLead.updateMany({
        where: {
            campaignId: campaign.id,
            status: 'FLAGGED'
        },
        data: {
            status: 'QUEUED',
            errorMessage: null,
            scheduledFor: new Date() // Ready to send now
        }
    });

    console.log(`✅ Reset ${result.count} leads.`);
}

resetFlaggedLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
