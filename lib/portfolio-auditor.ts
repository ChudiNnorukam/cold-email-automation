
import { JSDOM } from 'jsdom';

export interface AuditResult {
    score: number; // 0-100
    issues: string[];
    details: {
        ssl: boolean;
        mobileFriendly: boolean;
        loadTimeMs: number;
        copyrightYear: number | null;
        techStack: string[];
    };
}

export class PortfolioAuditor {

    async auditWebsite(url: string): Promise<AuditResult> {
        const issues: string[] = [];
        let score = 100;
        const start = Date.now();

        // 1. Check SSL
        const isSsl = url.startsWith('https://');
        if (!isSsl) {
            issues.push("Not using HTTPS (Insecure)");
            score -= 20;
        }

        try {
            // Fetch HTML
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            const loadTimeMs = Date.now() - start;
            const html = await response.text();

            // Parse HTML
            const dom = new JSDOM(html);
            const doc = dom.window.document;

            // 2. Check Mobile Responsiveness (Viewport Meta Tag)
            const viewport = doc.querySelector('meta[name="viewport"]');
            const isMobileFriendly = !!viewport;
            if (!isMobileFriendly) {
                issues.push("Not mobile responsive (Missing viewport tag)");
                score -= 30;
            }

            // 3. Check Performance (Load Time)
            // Note: This is server response time, not full render time.
            if (loadTimeMs > 2000) {
                issues.push(`Slow server response (${loadTimeMs}ms)`);
                score -= 10;
            }

            // 4. Check Copyright Year
            const bodyText = doc.body.textContent || "";
            const copyrightMatch = bodyText.match(/copyright\s+(?:©\s+)?(20\d{2})/i);
            let copyrightYear: number | null = null;

            if (copyrightMatch) {
                copyrightYear = parseInt(copyrightMatch[1]);
                const currentYear = new Date().getFullYear();
                if (copyrightYear < currentYear - 2) {
                    issues.push(`Outdated copyright year (${copyrightYear})`);
                    score -= 10;
                }
            }

            // 5. Check for "Made with" (Wix, Squarespace, etc.)
            // If they are a "Designer" but use a template builder, maybe that's an angle?
            // Or maybe we target custom coded sites that are broken?
            const techStack: string[] = [];
            if (html.includes('wix.com')) techStack.push('Wix');
            if (html.includes('squarespace.com')) techStack.push('Squarespace');
            if (html.includes('wp-content')) techStack.push('WordPress');

            return {
                score: Math.max(0, score),
                issues,
                details: {
                    ssl: isSsl,
                    mobileFriendly: isMobileFriendly,
                    loadTimeMs,
                    copyrightYear,
                    techStack
                }
            };

        } catch (error: any) {
            console.error(`Failed to audit ${url}:`, error.message);
            return {
                score: 0,
                issues: [`Failed to access site: ${error.message}`],
                details: {
                    ssl: isSsl,
                    mobileFriendly: false,
                    loadTimeMs: Date.now() - start,
                    copyrightYear: null,
                    techStack: []
                }
            };
        }
    }
}
