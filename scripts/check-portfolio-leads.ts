
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: "Portfolio Audit" } },
        include: { leads: { include: { lead: true } } }
    });

    if (campaign) {
        console.log(`\n📄 Leads in "${campaign.name}":`);
        if (campaign.leads.length === 0) {
            console.log("   (No leads found yet)");
        }
        campaign.leads.forEach(cl => {
            console.log(`- ${cl.lead.name} (${cl.lead.website}) - ${cl.lead.notes}`);
        });
    } else {
        console.log("Campaign not found.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
