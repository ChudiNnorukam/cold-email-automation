
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { WebSearchLeadFinder } from '../lib/web-search';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Running Lead Finder for Portfolio Audit Campaign...");

    const campaign = await prisma.campaign.findFirst({
        where: { name: { contains: "Portfolio Audit" } }
    });

    if (!campaign) {
        console.log("❌ Campaign not found");
        return;
    }

    if (!campaign.searchQuery) {
        console.log("❌ Campaign has no search query");
        return;
    }

    // Override query for testing
    const query = 'intitle:"portfolio" "freelance" "copyright 2010..2020" -site:linkedin.com -site:github.com -site:upwork.com -site:facebook.com';
    console.log(`Processing Campaign: ${campaign.name} with query: "${query}"`);

    const finder = new WebSearchLeadFinder();
    const leads = await finder.findLeads(query, 10);

    console.log(`\n✅ Found ${leads.length} leads.`);

    // Save them
    for (const leadData of leads) {
        const existing = await prisma.lead.findFirst({ where: { email: leadData.email } });
        if (!existing) {
            const lead = await prisma.lead.create({
                data: {
                    name: leadData.name,
                    company: leadData.company,
                    email: leadData.email,
                    website: leadData.website,
                    notes: `Source: ${leadData.source}`,
                    status: 'NEW'
                }
            });
            await prisma.campaignLead.create({
                data: { campaignId: campaign.id, leadId: lead.id, status: 'QUEUED' }
            });
            console.log(`   Saved: ${lead.name} (${lead.email})`);
        } else {
            console.log(`   Skipped (Duplicate): ${leadData.name}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
