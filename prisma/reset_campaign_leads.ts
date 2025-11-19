import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting "No Website Outreach" leads to QUEUED...');

    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (!campaign) {
        console.error("Campaign not found.");
        return;
    }

    const result = await prisma.campaignLead.updateMany({
        where: {
            campaignId: campaign.id,
            status: { in: ["SENT", "FAILED"] } // Reset those we just "sent"
        },
        data: {
            status: "QUEUED",
            sentAt: null,
            errorMessage: null
        }
    });

    console.log(`Reset ${result.count} leads to QUEUED.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
