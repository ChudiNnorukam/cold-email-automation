import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Setting up "Modern Redesign Outreach" campaign...');

    // 1. Find the Template
    const templateName = "Modern Redesign - The 'Fresh Look'";
    const template = await prisma.template.findFirst({
        where: { name: templateName }
    });

    if (!template) {
        console.error(`Template "${templateName}" not found! Please run add_redesign_template.ts first.`);
        return;
    }
    console.log(`Found template: ${template.name} (${template.id})`);

    // 2. Create the Campaign
    const campaignName = "Modern Redesign Outreach";
    let campaign = await prisma.campaign.findFirst({
        where: { name: campaignName }
    });

    if (!campaign) {
        campaign = await prisma.campaign.create({
            data: {
                name: campaignName,
                templateId: template.id,
                status: "DRAFT"
            }
        });
        console.log(`Created campaign: ${campaign.name} (${campaign.id})`);
    } else {
        console.log(`Campaign already exists: ${campaign.name} (${campaign.id})`);
    }

    // 3. Find Leads (Status = NEW)
    const leads = await prisma.lead.findMany({
        where: { status: "NEW" }
    });

    console.log(`Found ${leads.length} new leads.`);

    // 4. Add Leads to Campaign
    let addedCount = 0;
    for (const lead of leads) {
        // Check if already in campaign
        const existing = await prisma.campaignLead.findUnique({
            where: {
                campaignId_leadId: {
                    campaignId: campaign.id,
                    leadId: lead.id
                }
            }
        });

        if (!existing) {
            await prisma.campaignLead.create({
                data: {
                    campaignId: campaign.id,
                    leadId: lead.id,
                    status: "QUEUED"
                }
            });
            addedCount++;
        }
    }

    console.log(`Added ${addedCount} leads to the campaign.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
