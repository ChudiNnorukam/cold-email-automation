import prisma from '../lib/prisma';

async function verifyCampaign() {
    console.log("Checking for 'No Website' campaign...");
    const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: 'No Website', mode: 'insensitive' } }
    });

    if (campaign) {
        console.log(`✅ Found campaign: ${campaign.name} (ID: ${campaign.id})`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Search Query: ${campaign.searchQuery}`);
    } else {
        console.log("❌ 'No Website' campaign NOT found.");
        // Create it if missing? For now just report.
    }
}

verifyCampaign();
