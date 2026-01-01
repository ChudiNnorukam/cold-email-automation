import { z } from 'zod';
import { HunterClient } from './hunter';
import { WebSearchLeadFinder } from './web-search';

export const LeadResultSchema = z.object({
    name: z.string(),
    company: z.string(),
    email: z.string().email(),
    website: z.string().optional(),
    source: z.string(),
});

export type LeadResult = z.infer<typeof LeadResultSchema>;

export interface LeadFinder {
    findLeads(query: string, location: string, limit: number): Promise<LeadResult[]>;
}

// Mock implementation - In production, replace with Google Places / Hunter.io API
export class MockLeadFinder implements LeadFinder {
    async findLeads(query: string, location: string, limit: number): Promise<LeadResult[]> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockLeads: LeadResult[] = [
            {
                name: "Owner",
                company: "A C Electrical Systems",
                email: "contact@acelectricalsystems.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Manager",
                company: "A&D Crafts Electric",
                email: "info@andcraftselectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Service Team",
                company: "Aaron Smith Electric",
                email: "service@aaronsmithelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Office",
                company: "ABM Electric",
                email: "office@abmelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Support",
                company: "Absolute Electrical Contractors",
                email: "support@absoluteelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Info",
                company: "Active Electric, Inc.",
                email: "info@activeelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Sales",
                company: "Advance Electric, LLC",
                email: "sales@advanceelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Director",
                company: "Advanced Electric Design",
                email: "director@advancedelectricdesign.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Team",
                company: "Affordable Electric",
                email: "team@affordableelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Contact",
                company: "All Star Electric",
                email: "contact@allstarelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Admin",
                company: "Allied Electric",
                email: "admin@alliedelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Manager",
                company: "Alpha Electric",
                email: "manager@alphaelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Support",
                company: "American Electric",
                email: "support@americanelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Sales",
                company: "Apex Electric",
                email: "sales@apexelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Info",
                company: "Applied Electric",
                email: "info@appliedelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
            {
                name: "Service",
                company: "Arc Electric",
                email: "service@arcelectric.com", // Guessed/Mock
                source: "MockFinder",
            },
        ];

        // Return random subset
        const shuffled = mockLeads.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);
    }
}

// Real implementation using Google Places API (New)
export class GooglePlacesLeadFinder implements LeadFinder {
    private apiKey: string;
    private hunterClient: HunterClient;

    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API || "";
        this.hunterClient = new HunterClient();
        if (!this.apiKey) {
            console.warn("⚠️ GOOGLE_PLACES_API_KEY is missing. Falling back to Mock.");
        }
    }

    async findLeads(query: string, location: string, limit: number): Promise<LeadResult[]> {
        if (!this.apiKey) return new MockLeadFinder().findLeads(query, location, limit);

        const leads: LeadResult[] = [];
        let nextPageToken: string | undefined = undefined;
        const textQuery = `${query} in ${location}`;

        console.log(`🔍 Searching Google Places for: "${textQuery}" (Limit: ${limit})`);

        try {
            while (leads.length < limit) {
                const apiResponse: any = await fetch('https://places.googleapis.com/v1/places:searchText', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.businessStatus,places.types'
                    },
                    body: JSON.stringify({
                        textQuery: textQuery,
                        pageSize: 20,
                        pageToken: nextPageToken
                    })
                });

                if (!apiResponse.ok) {
                    const errorText = await apiResponse.text();
                    console.error(`Google Places API Error (${apiResponse.status}): ${errorText}`);
                    break;
                }

                const data = await apiResponse.json();
                const places = data.places || [];

                if (places.length === 0) break;

                for (const place of places) {
                    if (leads.length >= limit) break;

                    // Filter: Must be OPERATIONAL
                    if (place.businessStatus !== 'OPERATIONAL') continue;

                    const name = place.displayName?.text || "Unknown";
                    const company = place.displayName?.text || "Unknown";
                    const website = place.websiteUri;

                    let email = `missing_email_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.com`;
                    let source = "GooglePlaces";
                    let contactName = "Owner";

                    // --- ENRICHMENT: Hunter.io ---
                    if (website) {
                        try {
                            // Extract domain
                            const domain = new URL(website).hostname.replace('www.', '');
                            console.log(`   🔎 Enriching ${company} (${domain})...`);

                            const hunterResult = await this.hunterClient.findEmails(domain, company);

                            if (hunterResult) {
                                email = hunterResult.email;
                                source = "GooglePlaces+Hunter";
                                if (hunterResult.name) {
                                    contactName = hunterResult.name;
                                }
                                console.log(`      ✅ Found email: ${email} (Confidence: ${hunterResult.confidence}%)`);
                            } else {
                                console.log(`      ❌ No email found for ${domain}`);
                            }
                        } catch (e) {
                            console.error(`      ⚠️ Failed to enrich ${company}:`, e);
                        }
                    }

                    leads.push({
                        name: contactName,
                        company: company,
                        email: email,
                        website: website,
                        source: source,
                    });
                }

                nextPageToken = data.nextPageToken;
                if (!nextPageToken) break;

                await new Promise(r => setTimeout(r, 2000));
            }

        } catch (error) {
            console.error("Failed to fetch from Google Places:", error);
        }

        return leads;
    }
}

// Factory to get the appropriate finder
export function getLeadFinder(type: 'web'): WebSearchLeadFinder;
export function getLeadFinder(type?: 'places'): LeadFinder;
export function getLeadFinder(type: 'places' | 'web' = 'places') {
    if (type === 'web') {
        return new WebSearchLeadFinder();
    }
    // Check env vars to decide which implementation to use
    if (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API) {
        return new GooglePlacesLeadFinder();
    }
    return new MockLeadFinder();
}
