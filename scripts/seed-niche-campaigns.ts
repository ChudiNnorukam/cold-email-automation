
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const niches = [
    "Freelancers",
    "Real Estate Agents",
    "Salons",
    "Barbershops",
    "HVAC",
    "Plumbers",
    "Construction",
    "Restaurants",
    "Dentists",
    "Clinics",
    "Psychiatrists",
    "SMBs"
];

const LOCATION = "United States";

async function main() {
    console.log(`🌱 Seeding Campaigns for ${niches.length} niches in ${LOCATION}...`);

    // 1. Create a generic template (if not exists)
    // We'll try to find one first, or create a new one.
    let template = await prisma.template.findFirst({
        where: { name: "Generic Niche Outreach" }
    });

    if (!template) {
        template = await prisma.template.create({
            data: {
                name: "Generic Niche Outreach",
                subject: "Question about {{company}}",
                body: "Hi {{name}},\n\nI came across {{company}} while looking for top-rated businesses in {{location}}.\n\nWe help businesses like yours get more clients.\n\nAre you taking on new work right now?\n\nBest,\n[Your Name]"
            }
        });
        console.log("✅ Created generic template.");
    }

    for (const niche of niches) {
        const campaignName = `${niche} Outreach`;
        const searchQuery = `${niche} in ${LOCATION}`;

        // Check if campaign exists
        const existing = await prisma.campaign.findFirst({
            where: { name: campaignName }
        });

        if (existing) {
            console.log(`⚠️  Campaign "${campaignName}" already exists. Skipping.`);
            continue;
        }

        await prisma.campaign.create({
            data: {
                name: campaignName,
                status: "ACTIVE",
                templateId: template.id,
                searchQuery: searchQuery,
                scheduleConfig: JSON.stringify({
                    dailyLimit: 20, // Start slow
                    delayMin: 10,
                    delayMax: 60
                })
            }
        });

        console.log(`✅ Created Campaign: "${campaignName}" (Query: "${searchQuery}")`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
