
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Portfolio Audit Campaign...");

    // 1. Create Template
    const templateName = "Portfolio Audit Outreach";
    let template = await prisma.template.findFirst({
        where: { name: templateName }
    });

    if (!template) {
        template = await prisma.template.create({
            data: {
                name: templateName,
                subject: "Quick feedback on your portfolio",
                body: "Hi {{name}},\n\nI found your LinkedIn profile and took a look at your portfolio ({{website}}).\n\nI noticed a few technical things that might be hurting your conversions (e.g. mobile responsiveness or load speed).\n\nI help freelancers fix these issues to get more clients. Open to a quick chat?\n\nBest,\n[Your Name]"
            }
        });
        console.log("✅ Created template.");
    }

    // 2. Create Campaign
    const campaignName = "Freelancer Portfolio Audit";
    const existing = await prisma.campaign.findFirst({
        where: { name: campaignName }
    });

    if (existing) {
        console.log(`⚠️  Campaign "${campaignName}" already exists.`);
    } else {
        await prisma.campaign.create({
            data: {
                name: campaignName,
                status: "ACTIVE",
                templateId: template.id,
                searchQuery: "freelancer portfolio", // This triggers the WebSearch finder
                scheduleConfig: JSON.stringify({
                    dailyLimit: 10,
                    delayMin: 15,
                    delayMax: 45
                })
            }
        });
        console.log(`✅ Created Campaign: "${campaignName}"`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
