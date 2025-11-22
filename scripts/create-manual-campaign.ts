import prisma from '../lib/prisma';

async function createCampaign() {
    console.log("Creating 'No Website Outreach' campaign...");

    // 1. Find or Create Template
    let template = await prisma.template.findFirst({
        where: { name: "No Website Cold Outreach" }
    });

    if (!template) {
        console.log("Creating template...");
        template = await prisma.template.create({
            data: {
                name: "No Website Cold Outreach",
                subject: "Question about {{company}}'s website",
                body: "Hi {{name}},\n\nI couldn't find a website for {{company}}. Are you currently looking to build one?\n\nBest,\nChudi",
                isDefault: true
            }
        });
    }

    // 2. Create Campaign
    const campaign = await prisma.campaign.create({
        data: {
            name: "No Website Outreach",
            status: "ACTIVE",
            templateId: template.id,
            searchQuery: "electrician", // Default for sourcing
            scheduleConfig: JSON.stringify({ dailyLimit: 50 })
        }
    });

    console.log(`✅ Created campaign: ${campaign.name} (ID: ${campaign.id})`);
}

createCampaign();
