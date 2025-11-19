import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding "No Website" leads...');

    const leads = [
        {
            name: "Austin's Greatest Plumbing",
            email: "austinsgreatestplumbing@gmail.com",
            company: "Austin's Greatest Plumbing",
            notes: "Found via search. Uses Gmail, likely no website."
        },
        {
            name: "A&T Service Plumbing",
            email: "austinsplumbers@gmail.com",
            company: "A&T Service Plumbing",
            notes: "Found via search. Uses Gmail, likely no website."
        },
        {
            name: "Austin Plumber Tx",
            email: "Theplumberaustintx@gmail.com",
            company: "Austin Plumber Tx",
            notes: "Found via search. Uses Gmail, likely no website."
        },
        {
            name: "Calixto Plumbing",
            email: "calixtoplumbingatx@gmail.com",
            company: "Calixto Plumbing",
            notes: "Found via search. Uses Gmail, likely no website."
        },
        {
            name: "Team Flo-Right",
            email: "teamfloright@gmail.com",
            company: "Team Flo-Right",
            notes: "Found via search. Uses Gmail, likely no website."
        }
    ];

    // Ensure Campaign Exists
    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (!campaign) {
        console.error('Campaign "No Website Outreach" not found. Run manage_campaigns.ts first.');
        return;
    }

    for (const leadData of leads) {
        // Manual Upsert Logic
        let lead = await prisma.lead.findFirst({
            where: { email: leadData.email }
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name: leadData.name,
                    email: leadData.email,
                    company: leadData.company,
                    status: "NEW",
                    notes: leadData.notes
                }
            });
            console.log(`Created lead: ${lead.email}`);
        } else {
            console.log(`Lead already exists: ${lead.email}`);
        }

        // Add to Campaign
        await prisma.campaignLead.upsert({
            where: {
                campaignId_leadId: {
                    campaignId: campaign.id,
                    leadId: lead.id
                }
            },
            update: { status: "QUEUED" },
            create: {
                campaignId: campaign.id,
                leadId: lead.id,
                status: "QUEUED"
            }
        });

        console.log(`Added ${lead.email} to campaign.`);
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
