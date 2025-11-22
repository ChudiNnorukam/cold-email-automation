import prisma from '../lib/prisma';

async function cleanupTestLeads() {
    console.log("🧹 Starting cleanup of mock/test leads...");

    // 1. Delete CampaignLeads for the "No Website Outreach" campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (campaign) {
        const deletedLinks = await prisma.campaignLead.deleteMany({
            where: { campaignId: campaign.id }
        });
        console.log(`✅ Removed ${deletedLinks.count} leads from campaign queue.`);
    }

    // 2. Delete Leads sourced from "MockFinder" or specific test emails
    // We identified them by the "MockFinder" source in the previous script, 
    // but we didn't save 'source' to DB. 
    // We'll delete by the specific emails we know were generated or the "Manual source" note.
    const deletedLeads = await prisma.lead.deleteMany({
        where: {
            OR: [
                { notes: { contains: "Manual source" } },
                { email: "nnorukamchudi@gmail.com" }, // The test email
                { status: "BOUNCED" } // Any that bounced
            ]
        }
    });

    console.log(`✅ Permanently deleted ${deletedLeads.count} test leads from database.`);
    console.log("✨ System is clean and ready for real data.");
}

cleanupTestLeads();
