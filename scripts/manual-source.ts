import prisma from '../lib/prisma';
import { getLeadFinder } from '../lib/lead-finder';

async function sourceLeads() {
    console.log("Sourcing 15 leads for 'No Website Outreach'...");

    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" }
    });

    if (!campaign) {
        console.error("Campaign not found!");
        return;
    }

    const finder = getLeadFinder();
    const query = campaign.searchQuery || "electrician";
    console.log(`Using query: ${query}`);

    // Fetch 15 leads
    const leads = await finder.findLeads(query, "United States", 15);
    console.log(`Found ${leads.length} leads.`);

    let added = 0;
    for (const leadData of leads) {
        // Check duplicate
        const existing = await prisma.lead.findFirst({ where: { email: leadData.email } });
        if (existing) {
            console.log(`Skipping duplicate: ${leadData.email}`);
            continue;
        }

        // Create Lead
        const lead = await prisma.lead.create({
            data: {
                name: leadData.name,
                email: leadData.email,
                company: leadData.company,
                status: "NEW",
                notes: `Manual source for ${campaign.name}`
            }
        });

        // Add to Campaign
        await prisma.campaignLead.create({
            data: {
                campaignId: campaign.id,
                leadId: lead.id,
                status: "QUEUED"
            }
        });
        added++;
    }

    console.log(`✅ Successfully added ${added} leads to the queue.`);
}

sourceLeads();
