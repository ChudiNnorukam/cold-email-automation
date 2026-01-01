
import 'dotenv/config';
import { HunterClient } from '../lib/hunter';
import { getLeadFinder } from '../lib/lead-finder';

async function main() {
    console.log("🧪 Testing Hunter.io Integration...\n");

    // 1. Test Direct Client
    console.log("--- 1. Direct Client Test ---");
    const client = new HunterClient();
    const domain = "stripe.com";
    console.log(`Searching for emails at ${domain}...`);

    const result = await client.findEmails(domain);
    if (result) {
        console.log(`✅ Found: ${result.email} (Confidence: ${result.confidence}%)`);
        if (result.name) console.log(`   Name: ${result.name}`);
    } else {
        console.log("❌ No email found or API error.");
    }

    // 2. Test Lead Finder Integration
    console.log("\n--- 2. Lead Finder Integration Test ---");
    const finder = getLeadFinder('places');

    // Search for a company likely to have a website and emails
    // "Stripe" might be too generic for Google Places without location, let's try a local business or known tech company HQ
    const query = "Asana";
    const location = "San Francisco, CA";

    console.log(`Searching Google Places for "${query}" in "${location}"...`);
    const leads = await finder.findLeads(query, location, 1);

    if (leads.length > 0) {
        const lead = leads[0];
        console.log("\nLead Found:");
        console.log(`Name: ${lead.name}`);
        console.log(`Company: ${lead.company}`);
        console.log(`Email: ${lead.email}`);
        console.log(`Source: ${lead.source}`);
        console.log(`Website: ${lead.website}`);

        if (lead.source.includes("Hunter")) {
            console.log("\n✨ SUCCESS: Lead enriched with Hunter.io!");
        } else {
            console.log("\n⚠️  WARNING: Lead found but NOT enriched (Source: ${lead.source}). Check logs for details.");
        }
    } else {
        console.log("\n⚠️  No leads found to test enrichment.");
    }
}

main();
