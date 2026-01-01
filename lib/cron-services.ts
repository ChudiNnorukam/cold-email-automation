import prisma from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { getLeadFinder, LeadFinder } from "@/lib/lead-finder";
import { WebSearchLeadFinder } from "@/lib/web-search";

// ... (inside findNewLeads)



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

    // Find campaigns that are ACTIVE
    const activeCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        include: {
            sequence: {
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                        include: { template: true }
                    }
                }
            }
        }
    });

    if (activeCampaigns.length === 0) {
        return { message: 'No active campaigns', status: 200 };
    }

    let emailsSent = 0;
    const results = [];

    for (const campaign of activeCampaigns) {
        // Determine if we are using a Sequence or a Single Template
        const isSequence = !!campaign.sequenceId && !!campaign.sequence;

        // Find eligible leads
        // Logic:
        // 1. Status is QUEUED (Step 1)
        // 2. OR Status is SENT/CONTACTED but nextStepAt is past (Step > 1)
        // 3. AND Status is NOT REPLIED, BOUNCED, UNSUBSCRIBED, FAILED

        const leadsToProcess = await prisma.campaignLead.findMany({
            where: {
                campaignId: campaign.id,
                status: { in: ['QUEUED', 'SENT', 'CONTACTED'] },
                lead: {
                    status: { notIn: [LeadStatus.REPLIED, LeadStatus.BOUNCED, LeadStatus.NOT_INTERESTED] }
                },
                OR: [
                    {
                        status: 'QUEUED',
                        OR: [
                            { scheduledFor: null },
                            { scheduledFor: { lte: new Date() } }
                        ]
                    }, // Ready for Step 1 (Now or Past Scheduled Time)
                    {
                        status: { in: ['SENT', 'CONTACTED'] },
                        nextStepAt: { lte: new Date() } // Ready for Next Step
                    }
                ]
            },
            take: 10, // Batch size
            include: { lead: true }
        });

        for (const item of leadsToProcess) {
            if (smtpConfig.sentToday + emailsSent >= effectiveLimit) {
                break;
            }

            try {
                let templateToUse = null;
                let nextStepDelay = 0;
                let isLastStep = false;

                if (isSequence) {
                    const steps = campaign.sequence!.steps;
                    const currentStepIndex = item.currentStep - 1; // 1-based to 0-based

                    if (currentStepIndex >= steps.length) {
                        // Already finished sequence?
                        continue;
                    }

                    const step = steps[currentStepIndex];
                    templateToUse = step.template;

                    // Check if there is a next step
                    if (currentStepIndex + 1 < steps.length) {
                        nextStepDelay = steps[currentStepIndex + 1].delayDays;
                    } else {
                        isLastStep = true;
                    }

                } else {
                    // Legacy Single Template Mode
                    if (item.currentStep > 1) continue; // Only 1 step

                    if (campaign.templateId) {
                        templateToUse = await prisma.template.findUnique({
                            where: { id: campaign.templateId }
                        });
                    }
                    isLastStep = true;
                }

                if (!templateToUse) {
                    console.warn(`No template found for campaign ${campaign.name} step ${item.currentStep}`);
                    continue;
                }

                // --- SAFETY CHECKS (Verification, Content) ---
                const { verifyEmailDomain, isRoleBasedEmail } = await import("@/lib/email-verifier");
                if (isRoleBasedEmail(item.lead.email)) {
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'SKIPPED', errorMessage: 'Role-based email' }
                    });
                    continue;
                }

                // Only verify domain on Step 1 to save time/resources? Or every time?
                // Let's do it every time for safety.
                const isValidDomain = await verifyEmailDomain(item.lead.email);
                if (!isValidDomain) {
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'INVALID', errorMessage: 'DNS verification failed' }
                    });
                    continue;
                }

                const { checkContentSafety } = await import("@/lib/content-safety");
                const safetyResult = checkContentSafety(templateToUse.subject, templateToUse.body);
                if (!safetyResult.safe) {
                    await prisma.campaignLead.update({
                        where: { id: item.id },
                        data: { status: 'FLAGGED', errorMessage: `Spam triggers: ${safetyResult.triggers.join(', ')}` }
                    });
                    continue;
                }

                // --- SEND EMAIL ---
                await sendEmail(smtpConfig, templateToUse, item.lead);

                // --- UPDATE STATUS ---
                const updateData: any = {
                    status: 'SENT',
                    sentAt: new Date(),
                    currentStep: { increment: 1 }
                };

                if (!isLastStep) {
                    // Schedule next step
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + nextStepDelay);
                    updateData.nextStepAt = nextDate;
                } else {
                    updateData.nextStepAt = null;
                    // Maybe mark as COMPLETED? For now keep as SENT to show activity.
                }

                // Transactional Update
                await prisma.$transaction([
                    prisma.campaignLead.update({
                        where: { id: item.id },
                        data: updateData
                    }),
                    prisma.lead.update({
                        where: { id: item.leadId },
                        data: { status: LeadStatus.CONTACTED }
                    }),
                    prisma.smtpConfig.update({
                        where: { id: smtpConfig.id },
                        data: {
                            sentToday: { increment: 1 },
                            lastCronRun: new Date()
                        }
                    })
                ]);

                emailsSent++;
                results.push({ lead: item.lead.email, status: 'SENT', step: item.currentStep });

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

    const placesFinder = getLeadFinder('places') as LeadFinder;
    const webFinder = getLeadFinder('web') as WebSearchLeadFinder;
    const summary = [];

    for (const campaign of campaigns) {
        const c = campaign as any;
        if (!c.searchQuery) continue;

        try {
            let newLeads: any[] = [];

            // Determine which finder to use
            if (campaign.name.includes("Portfolio Audit")) {
                console.log(`Processing Web Search Campaign: ${campaign.name}`);
                // Web finder expects a single query string, not "keyword in location"
                newLeads = await webFinder.findLeads(c.searchQuery, 5);
            } else {
                // Default to Places finder
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

                newLeads = await placesFinder.findLeads(keyword, location, 5);
            }

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
                            notes: `Source: ${leadData.source}`,
                            status: LeadStatus.NEW
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
