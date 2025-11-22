import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 10 Screening Questions (Criteria for "Qualified" Leads)
// 1. Industry: Tech/SaaS/Agency? (Yes)
// 2. Role: Founder/CEO/Owner? (Yes)
// 3. Location: USA/Canada/UK? (Yes)
// 4. Company Size: 1-50? (Yes)
// 5. Website: Exists? (Yes)
// 6. Email: Verified? (Yes)
// 7. Revenue: >$0? (Yes)
// 8. Competitor: No? (Yes)
// 9. Previous Contact: No? (Yes)
// 10. Interest: Unknown? (Yes - Status NEW)

async function seedQualifiedLeads() {
    console.log("🌱 Seeding 50 Qualified Leads...");

    // 1. Create/Get Campaign & Template
    const template = await prisma.template.create({
        data: {
            name: "Qualified Outreach Template",
            subject: "Quick question about {{company}}",
            body: "Hi {{name}}, I saw what you're doing at {{company}} and wanted to reach out..."
        }
    });

    const campaign = await prisma.campaign.create({
        data: {
            name: "Qualified Leads Campaign",
            status: "ACTIVE",
            templateId: template.id
        }
    });

    console.log(`✅ Created Campaign: ${campaign.name} (${campaign.id})`);

    // 2. Generate 50 Leads
    const leads = [];
    const industries = ["SaaS", "Agency", "Tech", "Consulting"];
    const roles = ["CEO", "Founder", "Owner", "Director"];
    const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Toronto, CA"];

    // Calculate Schedule Window (Tomorrow 8am PST - 5pm PST)
    // 8am PST = 16:00 UTC
    // 5pm PST = 01:00 UTC (Next Day)

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(16, 0, 0, 0); // 8am PST (approx, ignoring DST for simplicity)

    const endTime = new Date(tomorrow);
    endTime.setUTCHours(25, 0, 0, 0); // 5pm PST (1am UTC next day)

    const windowMs = endTime.getTime() - tomorrow.getTime();

    for (let i = 0; i < 50; i++) {
        const industry = industries[Math.floor(Math.random() * industries.length)];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        leads.push({
            name: `Lead ${i + 1}`,
            email: `qualified.lead.${i + 1}@example.com`, // Mock email
            company: `Qualified Co ${i + 1}`,
            notes: `Industry: ${industry}, Role: ${role}, Location: ${location}`,
            status: LeadStatus.NEW
        });
    }

    // 3. Insert and Schedule
    let scheduledCount = 0;
    for (const leadData of leads) {
        // Create Lead
        const lead = await prisma.lead.create({
            data: leadData
        });

        // Calculate Random Time in Window
        const randomOffset = Math.floor(Math.random() * windowMs);
        const scheduledFor = new Date(tomorrow.getTime() + randomOffset);

        // Add to Campaign
        await prisma.campaignLead.create({
            data: {
                campaignId: campaign.id,
                leadId: lead.id,
                status: "QUEUED",
                scheduledFor: scheduledFor
            }
        });
        scheduledCount++;
    }

    console.log(`✅ Seeded ${scheduledCount} leads scheduled between ${tomorrow.toISOString()} and ${endTime.toISOString()}`);
}

seedQualifiedLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
