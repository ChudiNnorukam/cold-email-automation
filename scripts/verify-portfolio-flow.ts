
import 'dotenv/config';
import { getLeadFinder } from '../lib/lead-finder';

async function main() {
    console.log("🧪 Testing Portfolio Outreach Flow...\n");

    // 1. Get Web Search Finder
    const finder = getLeadFinder('web');

    // 2. Search for leads
    console.log("🔍 Searching for 'freelancer portfolio'...");
    const leads = await finder.findLeads("freelancer portfolio", 3);

    console.log(`\n✅ Found ${leads.length} leads:`);

    leads.forEach((lead, i) => {
        console.log(`\n--- Lead ${i + 1} ---`);
        console.log(`Name: ${lead.name}`);
        console.log(`Website: ${lead.website}`);
        console.log(`Source: ${lead.source}`);
        console.log(`Email: ${lead.email}`);
    });

    if (leads.length > 0) {
        // Check if source indicates audit score
        if (leads[0].source.includes("Audit Score")) {
            console.log("\n✨ SUCCESS: Leads found and audited!");
        } else {
            console.log("\n⚠️  WARNING: Leads found but audit info missing from source.");
        }
    } else {
        console.log("\n⚠️  No leads found. (Mock data might be filtered out if scores are too high?)");
    }
}

main();
