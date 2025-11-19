import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEARCH_QUERIES = [
    "plumbers in austin tx",
    "hvac in dallas tx",
    "roofers in houston tx",
    "landscapers in san antonio tx",
    "electricians in fort worth tx"
];

async function main() {
    // Pick a random query
    const baseQuery = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    // Construct Dork: plumbers austin tx gmail.com
    // Removing quotes to be broader
    const query = `${baseQuery} gmail.com`;

    console.log(`Starting daily sourcing for: ${query}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        await page.waitForTimeout(3000);

        // Extract results
        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.g');
            const data: any[] = [];

            items.forEach(item => {
                const element = item as HTMLElement;
                const text = element.innerText;
                // Regex to find emails
                const emailMatch = text.match(/([a-zA-Z0-9._-]+@gmail\.com)/gi);

                if (emailMatch) {
                    const email = emailMatch[0].toLowerCase();
                    // Try to find a name/company from the title (h3)
                    const titleElement = element.querySelector('h3');
                    let company = titleElement ? titleElement.innerText : "Unknown Business";

                    // Clean up company name (remove " - Google Search", etc.)
                    company = company.split('|')[0].split('-')[0].trim();

                    data.push({
                        email: email,
                        company: company,
                        name: company, // Default name to company
                        notes: `Found via Google Dork: ${text.substring(0, 100)}...`
                    });
                }
            });
            return data;
        });

        console.log(`Found ${results.length} potential leads.`);

        // Ensure Campaign Exists
        const campaign = await prisma.campaign.findFirst({
            where: { name: "No Website Outreach" }
        });

        if (!campaign) {
            console.error('Campaign "No Website Outreach" not found.');
            return;
        }

        for (const leadData of results) {
            // Check if exists
            const existing = await prisma.lead.findFirst({
                where: { email: leadData.email }
            });

            if (existing) {
                console.log(`Lead ${leadData.email} already exists. Skipping.`);
                continue;
            }

            // Create Lead
            const lead = await prisma.lead.create({
                data: {
                    name: leadData.name,
                    email: leadData.email,
                    company: leadData.company,
                    status: "NEW",
                    notes: leadData.notes
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

            console.log(`Added new lead: ${lead.email} (${lead.company})`);
        }

    } catch (error) {
        console.error("Sourcing failed:", error);
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}

main();
