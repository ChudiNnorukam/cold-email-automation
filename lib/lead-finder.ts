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
        ];

        // Return random subset
        const shuffled = mockLeads.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);
    }
}

// Factory to get the appropriate finder
export function getLeadFinder(): LeadFinder {
    // Check env vars to decide which implementation to use
    // if (process.env.GOOGLE_PLACES_KEY) return new GooglePlacesLeadFinder();
    return new MockLeadFinder();
}
