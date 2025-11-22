export interface HunterEmailResult {
    email: string;
    score: number;
    position?: string;
    source?: string;
    domain?: string;
}

export class HunterClient {
    private apiKey: string;
    private baseUrl = 'https://api.hunter.io/v2';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Find email by Company Name OR Domain
     */
    async findEmail(company: string, fullName?: string, domain?: string): Promise<HunterEmailResult | null> {
        try {
            const params = new URLSearchParams({
                api_key: this.apiKey
            });

            if (domain) {
                params.append('domain', domain);
            } else {
                params.append('company', company);
            }

            if (fullName) {
                params.append('full_name', fullName);
            }

            const url = `${this.baseUrl}/email-finder?${params.toString()}`;
            console.log(`🏹 Hunter Search: ${domain || company} (${fullName || 'No Name'})`);

            const response = await fetch(url);

            if (response.status === 429) {
                throw new Error("Hunter API Rate Limit Exceeded");
            }

            if (!response.ok) {
                // 400 usually means "Domain not found" or "Invalid Request"
                // We treat this as "No Email Found" rather than crashing
                const errorText = await response.text();
                console.warn(`Hunter API Warning (${response.status}): ${errorText}`);
                return null;
            }

            const data = await response.json();

            if (data.data && data.data.email) {
                return {
                    email: data.data.email,
                    score: data.data.score,
                    position: data.data.position,
                    source: 'Hunter.io',
                    domain: data.data.domain
                };
            }

            return null;

        } catch (error) {
            console.error("Hunter API Error:", error);
            return null;
        }
    }

    /**
     * Search Domain for ANY email
     */
    async searchDomain(domain: string): Promise<HunterEmailResult | null> {
        try {
            const params = new URLSearchParams({
                api_key: this.apiKey,
                domain: domain,
                limit: '1' // We only need one
            });

            const url = `${this.baseUrl}/domain-search?${params.toString()}`;
            console.log(`🏹 Hunter Domain Search: ${domain}`);

            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (data.data && data.data.emails && data.data.emails.length > 0) {
                const bestEmail = data.data.emails[0];
                return {
                    email: bestEmail.value,
                    score: bestEmail.confidence,
                    position: bestEmail.position,
                    source: 'Hunter.io (Domain Search)',
                    domain: domain
                };
            }

            return null;
        } catch (e) {
            console.error("Hunter Domain Search Error:", e);
            return null;
        }
    }
}
