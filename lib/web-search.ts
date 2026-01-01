
import { LeadResult } from './lead-finder';
import { PortfolioAuditor } from './portfolio-auditor';
import { HunterClient } from './hunter';

export class WebSearchLeadFinder {
    private apiKey: string;
    private cx: string;
    private auditor: PortfolioAuditor;
    private hunter: HunterClient;

    constructor() {
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || "";
        this.cx = process.env.GOOGLE_CX || "";
        this.auditor = new PortfolioAuditor();
        this.hunter = new HunterClient();

        if (!this.apiKey || !this.cx) {
            console.warn("⚠️ GOOGLE_SEARCH_API_KEY or GOOGLE_CX is missing. WebSearchLeadFinder will use MOCK data.");
        }
    }


    async findLeads(query: string, limit: number): Promise<LeadResult[]> {
        if (!this.apiKey || !this.cx) {
            console.error("❌ Missing GOOGLE_SEARCH_API_KEY or GOOGLE_CX. Cannot perform real search.");
            throw new Error("Missing Google Search Configuration");
        }

        const leads: LeadResult[] = [];
        const start = 1; // Google Search index starts at 1

        console.log(`🔍 Searching Google (Real API) for: "${query}"...`);

        try {
            // Fetch results from Google Custom Search API
            const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(query)}&num=10&start=${start}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Google Search API Error (${response.status}): ${errorText}`);
                return [];
            }

            const data = await response.json();
            const items = data.items || [];

            if (items.length === 0) {
                console.log("   No results found.");
                return [];
            }

            for (const item of items) {
                if (leads.length >= limit) break;

                const title = item.title;
                const link = item.link;
                const snippet = item.snippet;

                // Heuristic: Extract potential name from title (e.g. "John Doe - Freelance Designer")
                let name = "Unknown";
                if (title.includes("-")) {
                    name = title.split("-")[0].trim();
                } else if (title.includes("|")) {
                    name = title.split("|")[0].trim();
                } else {
                    name = title; // Fallback
                }

                console.log(`   🔎 Auditing ${link}...`);
                const audit = await this.auditor.auditWebsite(link);

                // Filter: Only target "poor" portfolios (Score < 80)
                if (audit.score >= 80) {
                    console.log(`      Skipping ${name} (Score: ${audit.score} - Too good)`);
                    continue;
                }

                console.log(`      🎯 Qualified! (Score: ${audit.score}) Issues: ${audit.issues.join(', ')}`);

                // Enrich with email (Try Hunter if domain is valid)
                let email = `missing_email_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.com`;
                let source = `WebSearch (Audit Score: ${audit.score})`;

                try {
                    const domain = new URL(link).hostname.replace('www.', '');
                    const hunterResult = await this.hunter.findEmails(domain, name);
                    if (hunterResult) {
                        email = hunterResult.email;
                        source += " + Hunter";
                        if (hunterResult.name) name = hunterResult.name; // Use better name from Hunter
                    }
                } catch (e) {
                    // Ignore URL parsing errors
                }

                leads.push({
                    name: name,
                    company: "Freelance / Portfolio",
                    email: email,
                    website: link,
                    source: source
                });
            }

        } catch (error: any) {
            console.error("Failed to perform Google Search:", error);
        }

        return leads;
    }

}
