import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient, LeadStatus } from '@prisma/client';
import { getLeadFinder } from '../lib/lead-finder';

const prisma = new PrismaClient();

async function generateRealLeads() {
    console.log("🌍 Generating Real Leads from Google Places...");
    console.log("DEBUG: GOOGLE_PLACES_API_KEY Present?", !!process.env.GOOGLE_PLACES_API_KEY);
    console.log("DEBUG: GOOGLE_PLACES_API Present?", !!process.env.GOOGLE_PLACES_API);
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API;
    console.log("DEBUG: Active API Key Length:", apiKey?.length);

    // 1. Get Campaign (Reuse "Modern Redesign Campaign" or create new)
    let campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" }
    });

    if (!campaign) {
        console.log("Creating 'Modern Redesign Campaign'...");
        // Create template if missing
        const template = await prisma.template.create({
            data: {
                name: "Modern Redesign Pitch Template",
                subject: "Quick question about {{Company}}",
                body: `Hi {{Name}},

I was checking out {{Company}}'s website today and noticed a few things that might be hurting your conversion rate.

I specialize in modern, high-converting redesigns for local businesses. I recently helped a similar company increase their leads by 40% with a fresh look.

Are you open to seeing a quick video audit of your current site? (No cost).

Best,
Chudi Nnorukam`
            }
        });

        campaign = await prisma.campaign.create({
            data: {
                name: "Modern Redesign Campaign",
                status: "ACTIVE",
                templateId: template.id
            }
        });
    }

    console.log(`✅ Using Campaign: ${campaign.name}`);

    // 2. Find Leads
    const finder = getLeadFinder('places');
    const queries = ["electrician", "plumber", "roofer", "hvac"];
    const locations = ["San Francisco, CA", "Los Angeles, CA", "New York, NY", "Chicago, IL", "Houston, TX"];

    let allLeads = [];

    // Loop until we have 50 leads
    for (const location of locations) {
        if (allLeads.length >= 50) break;

        for (const query of queries) {
            if (allLeads.length >= 50) break;

            console.log(`Searching for ${query} in ${location}...`);
            try {
                const results = await finder.findLeads(query, location, 20); // Fetch batch

                // Filter for WITH WEBSITE (Modern Redesign)
                const withWebsiteLeads = results.filter(l => l.website);

                console.log(`Found ${results.length} results. ${withWebsiteLeads.length} have a website.`);

                allLeads.push(...withWebsiteLeads);
            } catch (e) {
                console.error(`Error searching ${query} in ${location}:`, e);
            }

            // Be nice to API
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Trim to 50
    allLeads = allLeads.slice(0, 50);
    console.log(`🎯 Total Qualified Leads (With Website): ${allLeads.length}`);

    if (allLeads.length === 0) {
        console.warn("⚠️ No leads found! Check API Key or Quota.");
        return;
    }

    // 3. Schedule for Tomorrow 8am-5pm PST
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(16, 0, 0, 0); // 8am PST

    const endTime = new Date(tomorrow);
    endTime.setUTCHours(25, 0, 0, 0); // 5pm PST
    const windowMs = endTime.getTime() - tomorrow.getTime();

    let addedCount = 0;
    for (const leadData of allLeads) {
        // Check duplicate
        const existing = await prisma.lead.findFirst({
            where: { company: leadData.company }
        });

        if (!existing) {
            // Use placeholder email initially, will enrich later
            const placeholderEmail = `enrich_me_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.com`;

            const lead = await prisma.lead.create({
                data: {
                    name: leadData.name,
                    email: placeholderEmail,
                    company: leadData.company,
                    website: leadData.website, // Save website!
                    status: LeadStatus.NEW,
                    notes: `Source: Google Places (Has Website). Needs Enrichment.`
                }
            });

            const randomOffset = Math.floor(Math.random() * windowMs);
            const scheduledFor = new Date(tomorrow.getTime() + randomOffset);

            await prisma.campaignLead.create({
                data: {
                    campaignId: campaign.id,
                    leadId: lead.id,
                    status: "QUEUED",
                    scheduledFor: scheduledFor
                }
            });
            addedCount++;
        }
    }

    console.log(`✅ Added and Scheduled ${addedCount} leads.`);
}

generateRealLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
