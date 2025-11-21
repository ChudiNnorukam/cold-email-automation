import prisma from '../lib/prisma';

async function deleteCampaign() {
    const campaignName = "Modern Redesign Outreach";

    console.log(`🗑️ Attempting to delete campaign: "${campaignName}"...`);

    const campaign = await prisma.campaign.findFirst({
        where: { name: campaignName }
    });

    if (!campaign) {
        console.log(`❌ Campaign "${campaignName}" not found.`);
        return;
    }

    // Delete the campaign (Cascade delete should handle campaign leads)
    await prisma.campaign.delete({
        where: { id: campaign.id }
    });

    console.log(`✅ Successfully deleted campaign: "${campaignName}" (ID: ${campaign.id})`);
}

deleteCampaign()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
