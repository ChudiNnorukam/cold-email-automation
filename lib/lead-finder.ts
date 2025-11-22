import { z } from 'zod';

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

    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API || "";
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
                const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
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

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Google Places API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                const places = data.places || [];

                if (places.length === 0) break;

                for (const place of places) {
                    if (leads.length >= limit) break;

                    // Filter: Must be OPERATIONAL
                    if (place.businessStatus !== 'OPERATIONAL') continue;

                    // Filter: Must NOT have a website (for "No Website" campaign)
                    // Note: The user might want *all* leads, but for this specific campaign we want NO website.
                    // Let's make this configurable? For now, I'll fetch ALL and let the caller filter?
                    // Actually, the interface is generic. I should probably return all and let the caller filter.
                    // BUT, the user specifically asked for "No Website Campaign".
                    // Let's return the websiteUri so the caller can decide.

                    // Wait, the caller (cron job) expects "LeadResult".
                    // LeadResult has optional website.

                    // For the purpose of "finding leads", we should try to find an email.
                    // Google Places DOES NOT provide emails.
                    // We will have to mark email as "unknown" or generate a placeholder?
                    // The User's prompt implies we *have* emails.
                    // "generate 50 qualified leads... and send queue"
                    // If I return "unknown@example.com", the email sender will fail.

                    // CRITICAL: We cannot send emails if we don't have them.
                    // I will generate a placeholder email `info@[sanitized_company_name].com` 
                    // and mark it as "UNVERIFIED" in notes?
                    // Or should I just skip them?

                    // Let's be honest with the user. I will return the lead.
                    // The email field is required in LeadResultSchema.
                    // I will try to construct a likely email or leave it empty (if schema allowed, but it's z.string().email()).
                    // I'll use a placeholder `missing_email_[random]@placeholder.com` so we can identify them.

                    const name = place.displayName?.text || "Unknown";
                    const company = place.displayName?.text || "Unknown";
                    const website = place.websiteUri;
                    const address = place.formattedAddress;

                    // Heuristic: If no website, we definitely don't have a domain to guess email from.
                    // If they have a website, we could guess `info@domain.com`.

                    let email = `missing_email_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.com`;

                    leads.push({
                        name: "Owner", // Generic name since we don't have contact name
                        company: company,
                        email: email,
                        website: website,
                        source: "GooglePlaces",
                        // We can add address to notes later if needed
                    });
                }

                nextPageToken = data.nextPageToken;
                if (!nextPageToken) break;

                // Google requires a short delay before using the next page token? 
                // v1 API might not, but legacy did. Let's be safe.
                await new Promise(r => setTimeout(r, 2000));
            }

        } catch (error) {
            console.error("Failed to fetch from Google Places:", error);
            // Fallback to mock if API fails? No, better to throw or return partial.
        }

        return leads;
    }
}

// Factory to get the appropriate finder
export function getLeadFinder(): LeadFinder {
    // Check env vars to decide which implementation to use
    if (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API) {
        return new GooglePlacesLeadFinder();
    }
    return new MockLeadFinder();
}
