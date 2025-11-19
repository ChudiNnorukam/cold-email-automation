import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up test leads...');

    // Delete CampaignLeads first (foreign key constraint)
    const deletedCampaignLeads = await prisma.campaignLead.deleteMany({
        where: {
            lead: {
                name: { startsWith: "Auto Lead" }
            }
        }
    });
    console.log(`Deleted ${deletedCampaignLeads.count} campaign entries.`);

    // Delete Leads
    const deletedLeads = await prisma.lead.deleteMany({
        where: {
            name: { startsWith: "Auto Lead" }
        }
    });
    console.log(`Deleted ${deletedLeads.count} leads.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
