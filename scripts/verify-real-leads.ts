
import 'dotenv/config';
import { getLeadFinder } from '../lib/lead-finder';

async function main() {
    console.log("🔍 Testing Real Lead Fetching (Google Places)...");

    const finder = getLeadFinder('places');

    // Search for something specific
    const query = "Coffee Shop";
    const location = "San Francisco, CA";
    const limit = 3;

    console.log(`Searching for: "${query}" in "${location}" (Limit: ${limit})`);

    try {
        const leads = await finder.findLeads(query, location, limit);

        console.log(`\n✅ Found ${leads.length} leads:`);
        leads.forEach((lead, i) => {
            console.log(`\n--- Lead ${i + 1} ---`);
            console.log(`Name: ${lead.name}`);
            console.log(`Company: ${lead.company}`);
            console.log(`Email: ${lead.email}`);
            console.log(`Website: ${lead.website}`);
            console.log(`Source: ${lead.source}`);
        });

        if (leads.length > 0 && leads[0].source === 'GooglePlaces') {
            console.log("\n✨ SUCCESS: Real data fetched from Google Places!");
        } else if (leads.length > 0 && leads[0].source === 'MockFinder') {
            console.log("\n⚠️  WARNING: Still using MockFinder. Check API Key configuration.");
        } else {
            console.log("\n⚠️  No leads found.");
        }

    } catch (error) {
        console.error("\n❌ Error fetching leads:", error);
    }
}

main();
