
import { z } from 'zod';

const HunterResultSchema = z.object({
    data: z.object({
        emails: z.array(z.object({
            value: z.string().email(),
            type: z.string(), // "personal" or "generic"
            confidence: z.number().optional(),
            first_name: z.string().nullable().optional(),
            last_name: z.string().nullable().optional(),
            position: z.string().nullable().optional(),
        })).optional(),
        domain: z.string().optional(),
        organization: z.string().optional(),
    }).optional(),
    errors: z.array(z.object({
        id: z.string(),
        code: z.number(),
        details: z.string()
    })).optional()
});

export type HunterResult = z.infer<typeof HunterResultSchema>;

export class HunterClient {
    private apiKey: string;
    private baseUrl = 'https://api.hunter.io/v2';

    constructor() {
        this.apiKey = process.env.HUNTER_API_KEY || "";
        if (!this.apiKey) {
            console.warn("⚠️ HUNTER_API_KEY is missing. Email enrichment will be skipped.");
        }
    }

    /**
     * Find emails for a given domain
     */
    async findEmails(domain: string, companyName?: string): Promise<{ email: string, confidence: number, name?: string } | null> {
        if (!this.apiKey) return null;

        try {
            const url = `${this.baseUrl}/domain-search?domain=${domain}&api_key=${this.apiKey}&limit=10`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Hunter API Error (${response.status}): ${response.statusText}`);
                return null;
            }

            const json = await response.json();
            const result = HunterResultSchema.safeParse(json);

            if (!result.success) {
                console.error("Hunter API Response Validation Failed:", result.error);
                return null;
            }

            const emails = result.data.data?.emails;
            if (!emails || emails.length === 0) return null;

            // Strategy:
            // 1. Prefer "generic" emails (info@, contact@) for initial outreach if no specific person targeted?
            //    Actually, cold email best practice is usually specific person.
            //    But for this tool, maybe we want "Owner" or "Founder"?
            //    Hunter returns a list. Let's pick the one with highest confidence.

            // Sort by confidence
            emails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

            const bestEmail = emails[0];

            let name = undefined;
            if (bestEmail.first_name && bestEmail.last_name) {
                name = `${bestEmail.first_name} ${bestEmail.last_name}`;
            }

            return {
                email: bestEmail.value,
                confidence: bestEmail.confidence || 0,
                name: name
            };

        } catch (error) {
            console.error("Hunter API Exception:", error);
            return null;
        }
    }
}
