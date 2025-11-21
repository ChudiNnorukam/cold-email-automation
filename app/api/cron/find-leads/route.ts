import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getLeadFinder } from '@/lib/lead-finder';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 1. Find Active Campaigns with Auto-Sourcing (searchQuery set)
        const campaigns = await prisma.campaign.findMany({
            where: {
                status: 'ACTIVE',
                searchQuery: { not: null }
            }
        });

        if (campaigns.length === 0) {
            return NextResponse.json({ message: "No active campaigns with auto-sourcing enabled." });
        }

        const finder = getLeadFinder();
        const summary = [];

        for (const campaign of campaigns) {
            if (!campaign.searchQuery) continue;

            try {
                // Parse query (simple split for now, or pass raw if finder supports it)
                // Assuming finder takes (keyword, location, limit)
                // We might need to parse "electrician in Dayton, OH" -> keyword="electrician", location="Dayton, OH"
                // For now, let's assume the user puts "keyword | location" or we try to be smart.
                // Or better, let's just pass the whole string if the finder supports it, 
                // but the current signature is findLeads(keyword, location, limit).

                // Simple heuristic: split by " in " or comma
                let keyword = campaign.searchQuery;
                let location = "United States"; // Default

                if (campaign.searchQuery.includes(" in ")) {
                    const parts = campaign.searchQuery.split(" in ");
                    keyword = parts[0];
                    location = parts[1];
                } else if (campaign.searchQuery.includes(",")) {
                    const parts = campaign.searchQuery.split(",");
                    keyword = parts[0];
                    location = parts.slice(1).join(",").trim();
                }

                const newLeads = await finder.findLeads(keyword, location, 5); // Limit 5 per run per campaign

                let added = 0;
                let duplicates = 0;

                for (const leadData of newLeads) {
                    // Check duplicate globally
                    const existing = await prisma.lead.findFirst({
                        where: { email: leadData.email },
                    });

                    if (existing) {
                        duplicates++;
                        continue;
                    }

                    // Create Lead
                    const lead = await prisma.lead.create({
                        data: {
                            name: leadData.name,
                            email: leadData.email,
                            company: leadData.company,
                            status: "NEW",
                            notes: `Auto-discovered for '${campaign.name}' via ${leadData.source}`,
                        },
                    });

                    // Add to Campaign
                    await prisma.campaignLead.create({
                        data: {
                            campaignId: campaign.id,
                            leadId: lead.id,
                            status: "QUEUED",
                        },
                    });
                    added++;
                }
                summary.push({ campaign: campaign.name, found: newLeads.length, added, duplicates });

            } catch (error) {
                console.error(`Failed to process campaign ${campaign.name}:`, error);
                summary.push({ campaign: campaign.name, error: (error as any).message });
            }
        }

        return NextResponse.json({
            success: true,
            summary
        });

    } catch (error: any) {
        console.error("Lead generation cron failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
