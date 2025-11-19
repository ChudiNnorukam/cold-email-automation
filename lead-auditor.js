import { chromium } from 'playwright';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Configuration
const SEARCH_QUERY = 'web design agencies in San Francisco'; // Example query
const MAX_RESULTS = 10;
const OUTPUT_FILE = 'leads.json';

async function scrapeLeads() {
    console.log(`Starting scrape for: "${SEARCH_QUERY}"...`);
    const browser = await chromium.launch({ headless: false }); // Headless: false to see what's happening
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Search Google Maps (simulated via generic search engine for safety/simplicity in this example)
        // Note: Direct Google Maps scraping can be tricky with selectors. 
        // We will use a more generic "business directory" approach or just search results for this demo.
        // For a robust solution, consider using an API like Google Places API.

        // For this demo, let's assume we are visiting a directory listing or search result page.
        // Since I cannot actually scrape Google Maps without potentially violating TOS or hitting captchas easily,
        // I will demonstrate how to check a list of *potential* websites if you had them, 
        // OR we can try to find them via a search engine.

        // Let's try a safer, more manual-assist approach:
        // The user provides a list of domains, and we "audit" them.
        // OR we search for "intitle:index of" (just kidding).

        // Let's do a "Digital Audit" script. 
        // Input: A list of domains (which the user can get from Maps manually or via other tools).
        // Output: A report on "Needs Refresh?" (Mobile friendly? SSL? Copyright date?)

        const domainsToAudit = [
            'schmittheating.com',
            'galaxyservices.com',
            'acheatingandair.net',
            'bigblueplumbingservice.com',
            'magnificentplumbing.com',
            'undergroundrooter.com',
            'zandzplumbing.com',
            'lawrf.com',
            'sjdivorce.com',
            'fosterhsu.com'
        ];

        const results = [];

        for (const domain of domainsToAudit) {
            console.log(`Auditing ${domain}...`);
            try {
                const response = await page.goto(`http://${domain}`, { timeout: 10000, waitUntil: 'domcontentloaded' });

                if (!response) {
                    results.push({ domain, status: 'Unreachable', needsRefresh: true });
                    continue;
                }

                // Check 1: Is it mobile friendly? (Simple heuristic: viewport meta tag)
                const viewport = await page.$('meta[name="viewport"]');
                const isMobileFriendly = !!viewport;

                // Check 2: SSL?
                const isSecure = response.url().startsWith('https');

                // Check 3: Copyright date?
                const text = await page.content();
                const currentYear = new Date().getFullYear();
                const hasCurrentYear = text.includes(currentYear.toString());

                // Check 4: Find Emails
                const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
                const contentEmails = text.match(emailRegex) || [];

                // Also check mailto links specifically
                const mailtoLinks = await page.$$eval('a[href^="mailto:"]', elements =>
                    elements.map(el => el.getAttribute('href').replace('mailto:', '').split('?')[0])
                );

                // Combine and deduplicate
                const foundEmails = [...new Set([...contentEmails, ...mailtoLinks])];

                results.push({
                    domain,
                    status: 'Active',
                    isMobileFriendly,
                    isSecure,
                    hasCurrentYear,
                    emails: foundEmails,
                    needsRefresh: !isMobileFriendly || !isSecure || !hasCurrentYear
                });

            } catch (e) {
                results.push({ domain, error: e.message, needsRefresh: true });
            }
        }

        console.log('Audit complete:', results);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

        // --- Save to Database ---
        console.log('Saving valid leads to database...');
        const prisma = new PrismaClient();

        try {
            let savedCount = 0;
            for (const result of results) {
                // Only save if we found emails
                if (result.emails && result.emails.length > 0) {
                    // Use the first email found
                    const email = result.emails[0];

                    // Check if lead already exists
                    const existing = await prisma.lead.findFirst({
                        where: { email: email }
                    });

                    if (!existing) {
                        await prisma.lead.create({
                            data: {
                                name: "Unknown (From Audit)", // Placeholder, user can update later
                                email: email,
                                company: result.domain,
                                notes: `Audited via script. Mobile Friendly: ${result.isMobileFriendly}, Secure: ${result.isSecure}`,
                                status: "NEW"
                            }
                        });
                        console.log(`Saved lead: ${email} (${result.domain})`);
                        savedCount++;
                    } else {
                        console.log(`Skipped duplicate: ${email}`);
                    }
                }
            }
            console.log(`Successfully saved ${savedCount} new leads.`);
        } catch (dbError) {
            console.error('Database save failed:', dbError);
        } finally {
            await prisma.$disconnect();
        }

    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        await browser.close();
    }
}

scrapeLeads();
