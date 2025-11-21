import prisma from '../lib/prisma';

async function seedLeads() {
    console.log('🌱 Seeding 5 quality leads for "No Website Outreach"...');

    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (!campaign) {
        console.error('❌ Campaign "No Website Outreach" not found.');
        return;
    }

    const leads = [
        {
            name: "Owner",
            company: "A C Electrical Systems",
            email: "info@acelectricalsystems.com", // Placeholder
            notes: "Dayton Electrician - No Website Found. Verify email before sending.",
        },
        {
            name: "Manager",
            company: "A&D Crafts Electric",
            email: "contact@andcraftselectric.com", // Placeholder
            notes: "Dayton Electrician - No Website Found. Verify email before sending.",
        },
        {
            name: "Service Team",
            company: "Aaron Smith Electric",
            email: "service@aaronsmithelectric.com", // Placeholder
            notes: "Dayton Electrician - No Website Found. Verify email before sending.",
        },
        {
            name: "Office",
            company: "ABM Electric",
            email: "office@abmelectric.com", // Placeholder
            notes: "Dayton Electrician - No Website Found. Verify email before sending.",
        },
        {
            name: "Support",
            company: "Absolute Electrical Contractors",
            email: "support@absoluteelectric.com", // Placeholder
            notes: "Dayton Electrician - No Website Found. Verify email before sending.",
        },
    ];

    for (const l of leads) {
        // Check if exists
        const existing = await prisma.lead.findFirst({ where: { email: l.email } });
        if (existing) {
            console.log(`⚠️ Lead ${l.email} already exists. Skipping.`);
            continue;
        }

        const lead = await prisma.lead.create({
            data: {
                name: l.name,
                email: l.email,
                company: l.company,
                status: "NEW",
                notes: l.notes,
            }
        });

        await prisma.campaignLead.create({
            data: {
                campaignId: campaign.id,
                leadId: lead.id,
                status: "QUEUED",
            }
        });

        console.log(`✅ Added ${l.company} to campaign.`);
    }
}

seedLeads()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
