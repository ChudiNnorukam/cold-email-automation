import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getLeadFinder } from "@/lib/lead-finder";

export async function processEmailQueue() {
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) return { message: 'SMTP not configured', status: 400 };

    // @ts-ignore
    if (smtpConfig.isSystemPaused) {
        return { message: 'System is paused by Kill Switch', status: 200 };
    }

    // --- SAFETY: Warm-up Logic ---
    const WARMUP_DAYS = 14;
    const WARMUP_LIMIT = 10;
    const HARD_LIMIT = 50;

    const accountAge = Math.floor((new Date().getTime() - new Date(smtpConfig.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const isWarmupPeriod = accountAge < WARMUP_DAYS;

    // Effective limit is the lower of the configured dailyLimit or the safety limits
    let effectiveLimit = Math.min(smtpConfig.dailyLimit, HARD_LIMIT);

    if (isWarmupPeriod) {
        effectiveLimit = Math.min(effectiveLimit, WARMUP_LIMIT);
        console.log(`🔒 Warm-up mode active (Age: ${accountAge} days). Limit restricted to ${effectiveLimit}.`);
    }

    if (smtpConfig.sentToday >= effectiveLimit) {
        return { message: `Daily limit reached (${smtpConfig.sentToday}/${effectiveLimit})`, status: 200 };
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
            if (smtpConfig.sentToday + emailsSent >= effectiveLimit) {
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

                // --- SAFETY: Email Verification ---
                const { verifyEmailDomain, isRoleBasedEmail } = await import("@/lib/email-verifier");

                if (isRoleBasedEmail(item.lead.email)) {
                    console.warn(`Skipping role-based email: ${item.lead.email}`);
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'SKIPPED', errorMessage: 'Role-based email detected' }
                    });
                    continue;
                }

                const isValidDomain = await verifyEmailDomain(item.lead.email);
                if (!isValidDomain) {
                    console.warn(`Skipping invalid domain: ${item.lead.email}`);
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'INVALID', errorMessage: 'DNS verification failed' }
                    });
                    continue;
                }

                // --- SAFETY: Content Check ---
                const { checkContentSafety } = await import("@/lib/content-safety");
                const safetyResult = checkContentSafety(template.subject, template.body);

                if (!safetyResult.safe) {
                    console.warn(`Skipping unsafe content: ${safetyResult.triggers.join(', ')}`);
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'FLAGGED', errorMessage: `Spam triggers: ${safetyResult.triggers.join(', ')}` }
                    });
                    continue;
                }

                // Send email
                await sendEmail(smtpConfig, template, item.lead);

                // Transactional Update: Status + Usage
                await prisma.$transaction([
                    prisma.campaignLead.update({
                        where: { id: item.id },
                        data: {
                            status: 'SENT',
                            sentAt: new Date()
                        }
                    }),
                    prisma.smtpConfig.update({
                        where: { id: smtpConfig.id },
                        data: { sentToday: { increment: 1 } }
                    })
                ]);

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
            // @ts-ignore
            searchQuery: { not: null }
        },
        select: {
            id: true,
            name: true,
            // @ts-ignore
            searchQuery: true
        }
    });

    const finder = getLeadFinder();
    const summary = [];

    for (const campaign of campaigns) {
        const c = campaign as any;
        if (!c.searchQuery) continue;

        try {
            // Parse query: "electrician in Dayton, OH"
            let keyword = c.searchQuery;
            let location = "United States";

            if (c.searchQuery.includes(" in ")) {
                const parts = c.searchQuery.split(" in ");
                keyword = parts[0];
                location = parts[1];
            } else if (c.searchQuery.includes(",")) {
                const parts = c.searchQuery.split(",");
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
