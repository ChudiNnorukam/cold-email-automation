import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { HunterClient } from '../lib/hunter';

const prisma = new PrismaClient();

async function enrichLeads() {
    console.log("💎 Enriching Leads with Hunter.io...");

    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
        console.error("❌ HUNTER_API_KEY is missing in .env");
        process.exit(1);
    }

    const hunter = new HunterClient();

    // 1. Find Leads with Placeholder Emails AND Website
    const leads = await prisma.lead.findMany({
        where: {
            email: { contains: '@placeholder.com' },
            website: { not: null }
        }
    });

    console.log(`Found ${leads.length} leads to enrich (with websites).`);

    let enrichedCount = 0;
    let notFoundCount = 0;

    for (const lead of leads) {
        // Delay to respect rate limits
        await new Promise(r => setTimeout(r, 2000));

        // Extract domain from website
        let domain = lead.website;
        if (domain) {
            try {
                // Handle "http://www.example.com/foo" -> "example.com"
                const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
                domain = url.hostname.replace('www.', '');
            } catch (e) {
                console.warn(`Invalid URL for ${lead.company}: ${lead.website}`);
                domain = null;
            }
        }

        if (!domain) {
            console.log(`❌ Skipping ${lead.company} (No valid domain)`);
            continue;
        }

        // Use Domain Search (via Company search fallback in client, or update client?)
        // Hunter Client `findEmail` uses `company` param.
        // Let's update HunterClient to support `domain` param explicitly?
        // Or just pass domain as company? Hunter might be smart enough.
        // Actually, let's update HunterClient to be cleaner.

        // For now, I'll assume the client needs an update to support domain search properly.
        // But let's check lib/hunter.ts content again? 
        // It uses `company` param.
        // Hunter API `email-finder` takes `domain`.
        // So I should pass `domain` to `findEmail` if I update the client.

        // Let's just call the client with the domain as the company arg for now, 
        // BUT I should really update the client to use `domain` param if available.

        // Wait, I can't easily update the client in this step without another tool call.
        // I'll just try to pass the domain as the company name. Hunter often resolves it.
        // OR, I can update the client in the next step.
        // Use Domain Search
        const result = await hunter.findEmails(domain, lead.company ?? undefined);

        if (result) {
            console.log(`✅ Found Email for ${lead.company}: ${result.email} (Confidence: ${result.confidence}%)`);

            // Update Lead
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    email: result.email,
                    notes: `${lead.notes || ''}\n[Enriched] Email found via Hunter.io (Confidence: ${result.confidence}%, Domain: ${domain})`
                }
            });
            enrichedCount++;
        } else {
            console.log(`❌ No Email found for ${lead.company}`);
            notFoundCount++;

            // Optionally mark as failed enrichment in notes
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    notes: `${lead.notes || ''}\n[Enriched] Failed to find email via Hunter.io`
                }
            });
        }
    }

    console.log(`\n🎉 Enrichment Complete.`);
    console.log(`✅ Enriched: ${enrichedCount}`);
    console.log(`❌ Not Found: ${notFoundCount}`);
}

enrichLeads()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
