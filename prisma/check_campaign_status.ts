import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking "No Website Outreach" campaign status...');

    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" },
        include: {
            leads: {
                include: { lead: true }
            }
        }
    });

    if (!campaign) {
        console.error("Campaign not found.");
        return;
    }

    console.log(`\nCampaign: ${campaign.name}`);
    console.log(`Total Leads: ${campaign.leads.length}`);

    const sent = campaign.leads.filter(l => l.status === 'SENT');
    const queued = campaign.leads.filter(l => l.status === 'QUEUED');
    const failed = campaign.leads.filter(l => l.status === 'FAILED');
    const bounced = campaign.leads.filter(l => l.status === 'BOUNCED');

    console.log(`Stats: SENT=${sent.length}, QUEUED=${queued.length}, FAILED=${failed.length}, BOUNCED=${bounced.length}`);

    console.log('\n--- Recent Activity ---');
    // Show last 5 sent
    sent.slice(-5).forEach(l => {
        console.log(`[SENT] ${l.lead.email} at ${l.sentAt}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
