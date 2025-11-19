import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Managing campaigns...');

    // 1. Pause others
    const campaignsToPause = [
        "Modern Redesign Outreach",
        "Bad Mobile Site Outreach" // Assuming name, will check partial match
    ];

    for (const name of campaignsToPause) {
        const result = await prisma.campaign.updateMany({
            where: { name: { contains: name } },
            data: { status: "PAUSED" }
        });
        console.log(`Paused ${result.count} campaigns matching "${name}".`);
    }

    // 2. Ensure "No Website" campaign exists and is active
    let noWebsiteCampaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (!noWebsiteCampaign) {
        console.log('Creating "No Website Outreach" campaign...');
        const template = await prisma.template.findFirst({
            where: { name: { contains: "No Website" } }
        });

        if (template) {
            noWebsiteCampaign = await prisma.campaign.create({
                data: {
                    name: "No Website Outreach",
                    templateId: template.id,
                    status: "ACTIVE"
                }
            });
            console.log('Created "No Website Outreach" campaign.');
        } else {
            console.error('Could not find "No Website" template.');
        }
    } else {
        console.log('"No Website Outreach" campaign already exists. Setting to ACTIVE.');
        await prisma.campaign.update({
            where: { id: noWebsiteCampaign.id },
            data: { status: "ACTIVE" }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
