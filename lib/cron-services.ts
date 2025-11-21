import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getLeadFinder } from "@/lib/lead-finder";

export async function processEmailQueue() {
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) return { message: 'SMTP not configured', status: 400 };

    if (smtpConfig.isSystemPaused) {
        return { message: 'System is paused by Kill Switch', status: 200 };
    }

    if (smtpConfig.sentToday >= smtpConfig.dailyLimit) {
        return { message: 'Daily limit reached', status: 200 };
    }

    // Reset daily limit if needed
    const now = new Date();
    if (now.getDate() !== smtpConfig.lastResetDate.getDate()) {
        await prisma.smtpConfig.update({
            where: { id: smtpConfig.id },
            data: {
                sentToday: 0,
                lastResetDate: now
            }
        });
        smtpConfig.sentToday = 0;
    }

    // Find campaigns that are ACTIVE and have a template
    const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, templateId: true, scheduleConfig: true }
    });

    if (activeCampaigns.length === 0) {
        return { message: 'No active campaigns', status: 200 };
    }

    let emailsSent = 0;
    const results = [];

    for (const campaign of activeCampaigns) {
        if (!campaign.templateId) continue;

        // Check campaign schedule/limits (simplified for now)
        // In a real app, parse scheduleConfig and check time windows

        // Find eligible leads: QUEUED status
        const leadsToProcess = await prisma.campaignLead.findMany({
            where: {
                campaignId: campaign.id,
                status: 'QUEUED'
            },
            take: 10, // Batch size
            include: { lead: true }
        });

        for (const item of leadsToProcess) {
            if (smtpConfig.sentToday + emailsSent >= smtpConfig.dailyLimit) {
                break;
            }

            try {
                // Get template
                const template = await prisma.template.findUnique({
                    where: { id: campaign.templateId }
                });

                if (!template) {
                    throw new Error('Template not found');
                }

                // Send email
                await sendEmail(smtpConfig, template, item.lead);

                // Update status
                await prisma.campaignLead.update({
                    where: { id: item.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date()
                    }
                });

                // Update SMTP usage
                await prisma.smtpConfig.update({
                    where: { id: smtpConfig.id },
                    data: { sentToday: { increment: 1 } }
                });

                emailsSent++;
                results.push({ lead: item.lead.email, status: 'SENT' });

                // Rate limit delay
                await new Promise(r => setTimeout(r, 1000));

            } catch (error: any) {
                console.error(`Failed to process lead ${item.lead.email}:`, error);
                await prisma.campaignLead.update({
                    where: { id: item.id },
                    data: { status: 'FAILED', errorMessage: error.message }
                });
                results.push({ lead: item.lead.email, status: 'FAILED', error: error.message });
            }
        }
    }

    return { message: `Processed ${emailsSent} emails`, results, status: 200 };
}

export async function findNewLeads() {
    const campaigns = await prisma.campaign.findMany({
        where: {
            status: 'ACTIVE',
            searchQuery: { not: null }
        }
    });

    const finder = getLeadFinder();
    const summary = [];

    for (const campaign of campaigns) {
        if (!campaign.searchQuery) continue;

        try {
            // Parse query: "electrician in Dayton, OH"
            let keyword = campaign.searchQuery;
            let location = "United States";

            if (campaign.searchQuery.includes(" in ")) {
                const parts = campaign.searchQuery.split(" in ");
                keyword = parts[0];
                location = parts[1];
            } else if (campaign.searchQuery.includes(",")) {
                const parts = campaign.searchQuery.split(",");
                keyword = parts[0];
                location = parts.slice(1).join(",").trim();
            }

            // Find leads
            const newLeads = await finder.findLeads(keyword, location, 5); // Limit 5

            let added = 0;
            for (const leadData of newLeads) {
                // Check duplicate
                const existing = await prisma.lead.findFirst({
                    where: { email: leadData.email }
                });

                if (!existing) {
                    const lead = await prisma.lead.create({
                        data: {
                            ...leadData,
                            status: 'NEW'
                        }
                    });

                    // Add to campaign
                    await prisma.campaignLead.create({
                        data: {
                            campaignId: campaign.id,
                            leadId: lead.id,
                            status: 'QUEUED'
                        }
                    });
                    added++;
                }
            }
            summary.push({ campaign: campaign.name, found: newLeads.length, added });

        } catch (error: any) {
            console.error(`Failed to process campaign ${campaign.name}:`, error);
            summary.push({ campaign: campaign.name, error: error.message });
        }
    }

    return { summary, status: 200 };
}
