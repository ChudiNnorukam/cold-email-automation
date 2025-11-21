import prisma from '../lib/prisma';

async function listCampaigns() {
    const campaigns = await prisma.campaign.findMany({
        include: {
            _count: {
                select: { leads: true }
            }
        }
    });

    console.log('📋 Current Campaigns:');
    campaigns.forEach(c => {
        console.log(`- [${c.id}] "${c.name}" (Status: ${c.status}, Leads: ${c._count.leads})`);
    });
}

listCampaigns()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
