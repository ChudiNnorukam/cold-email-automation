
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const campaignName = "Freelancer Portfolio Audit";
    // More specific query to find personal sites, excluding major platforms
    const newQuery = 'intitle:"portfolio" "freelance web designer" -site:linkedin.com -site:upwork.com -site:behance.net -site:dribbble.com -site:pinterest.com -site:awwwards.com';

    const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: "Portfolio Audit" } }
    });

    if (campaign) {
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { searchQuery: newQuery }
        });
        console.log(`✅ Updated query for "${campaign.name}" to:\n   ${newQuery}`);
    } else {
        console.log("❌ Campaign not found.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
