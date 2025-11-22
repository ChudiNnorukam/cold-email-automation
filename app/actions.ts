'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/crypto";
import { testConnection } from "@/lib/email";

import { LeadStatus } from "@prisma/client";

// ... imports

// Valid enum values from Prisma schema
const VALID_CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;
// Updated to match schema
const VALID_LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CLOSED',
    'SENT', 'QUEUED', 'FAILED', 'SKIPPED', 'INVALID', 'FLAGGED', 'BOUNCED'
] as const;

type CampaignStatus = typeof VALID_CAMPAIGN_STATUSES[number];

function validateCampaignStatus(status: string): status is CampaignStatus {
    return VALID_CAMPAIGN_STATUSES.includes(status as CampaignStatus);
}

function validateLeadStatus(status: string): status is LeadStatus {
    return VALID_LEAD_STATUSES.includes(status as any);
}

// ... schemas

export async function createLead(formData: FormData) {
    // ... (parsing)

    try {
        await prisma.lead.create({
            data: {
                ...result.data,
                status: LeadStatus.NEW,
            },
        });
        // ...
    } catch (error) {
        // ...
    }
}

export async function updateLeadStatus(leadId: string, status: string) {
    try {
        if (!validateLeadStatus(status)) {
            return { error: "Invalid status" };
        }

        await prisma.lead.update({
            where: { id: leadId },
            data: { status: status as LeadStatus },
        });
        revalidatePath("/leads");
        revalidatePath(`/outreach/${leadId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update lead status:", error);
        return { error: "Failed to update status." };
    }
}

export async function deleteLead(leadId: string) {
    try {
        await prisma.lead.delete({
            where: { id: leadId },
        });
        revalidatePath("/leads");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete lead:", error);
        return { error: "Failed to delete lead." };
    }
}

export async function createTemplate(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        subject: formData.get("subject"),
        body: formData.get("body"),
    };

    const result = TemplateSchema.safeParse(rawData);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    try {
        await prisma.template.create({
            data: result.data,
        });

        revalidatePath("/templates");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to create template:", error);
        return { error: "Failed to create template." };
    }
}

export async function deleteTemplate(templateId: string) {
    try {
        await prisma.template.delete({
            where: { id: templateId },
        });
        revalidatePath("/templates");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete template:", error);
        return { error: "Failed to delete template." };
    }
}

export async function seedTemplates() {
    const templates = [
        {
            name: "Value-First Approach",
            subject: "Quick question about {{Company}}'s website",
            body: `Hi {{Name}},

I was browsing {{Company}}'s website and noticed [mention specific observation or compliment].

I'm Chudi, a freelance web developer specializing in building high-performance, visually stunning websites. I recently helped a client achieve [benefit/result] and I'd love to do the same for you.

You can check out my recent work here: {{MyPortfolio}}
And my professional background here: {{MyLinkedIn}}

Are you open to a 10-minute chat next week to discuss how we can improve your web presence?

Best,
Chudi`
        },
        {
            name: "Portfolio Showcase",
            subject: "Web development for {{Company}}",
            body: `Hi {{Name}},

I'm writing to you because I think {{Company}} has a great brand, and I see an opportunity to elevate your digital presence to match it.

I am a web developer who focuses on creating unique, premium web experiences. I've built projects using the latest tech stacks (Next.js, React) that focus on speed and aesthetics.

Take a look at my portfolio: {{MyPortfolio}}

I'd love to hear your thoughts on a potential collaboration.

Cheers,
Chudi`
        }
    ];

    for (const t of templates) {
        await prisma.template.create({
            data: t
        });
    }

    revalidatePath("/templates");
}

// SMTP Configuration Actions
export async function createSmtpConfig(formData: FormData) {
    const rawData = {
        provider: formData.get("provider")?.toString(),
        host: formData.get("host")?.toString() || undefined,
        port: formData.get("port") ? parseInt(formData.get("port")!.toString()) : undefined,
        secure: formData.get("secure") === "true",
        user: formData.get("user")?.toString(),
        password: formData.get("password")?.toString(),
        fromName: formData.get("fromName")?.toString(),
        fromEmail: formData.get("fromEmail")?.toString(),
        dailyLimit: formData.get("dailyLimit") ? parseInt(formData.get("dailyLimit")!.toString()) : 50,
    };

    const result = SmtpConfigSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation error:", result.error.flatten());
        return { error: "Validation failed" };
    }

    // Encrypt password before saving
    const encryptedPassword = encrypt(result.data.password);

    try {
        // Delete existing config (single config app)
        await prisma.smtpConfig.deleteMany({});

        await prisma.smtpConfig.create({
            data: {
                ...result.data,
                password: encryptedPassword,
                host: result.data.host || null,
                port: result.data.port || null,
            },
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to save SMTP config:", error);
        return { error: "Failed to save SMTP configuration." };
    }
}

export async function getSmtpConfig() {
    const config = await prisma.smtpConfig.findFirst();
    if (!config) return null;

    // Return config without decrypted password for display
    return {
        ...config,
        password: "••••••••",
    };
}

export async function testSmtpConnection() {
    const config = await prisma.smtpConfig.findFirst();
    if (!config) {
        return { error: "SMTP not configured" };
    }

    const isValid = await testConnection(config as any);

    if (isValid) {
        return { success: true };
    } else {
        return { error: "Connection failed. Check your credentials." };
    }
}

export async function toggleSystemPause(isPaused: boolean) {
    try {
        const config = await prisma.smtpConfig.findFirst();
        if (!config) return { error: "SMTP not configured" };

        await prisma.smtpConfig.update({
            where: { id: config.id },
            data: { isSystemPaused: isPaused }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle system pause:", error);
        return { error: "Failed to update system status." };
    }
}

export async function runManualCron(job: 'send-emails' | 'find-leads' | 'master') {
    try {
        const { processEmailQueue, findNewLeads } = await import('@/lib/cron-services');

        if (job === 'send-emails') {
            const result = await processEmailQueue();
            return { success: true, ...result };
        } else if (job === 'find-leads') {
            const result = await findNewLeads();
            return { success: true, ...result };
        } else if (job === 'master') {
            const emailResult = await processEmailQueue();
            const leadResult = await findNewLeads();
            return {
                success: true,
                message: `Master Cron: Emails (${emailResult.message}), Leads (${leadResult.summary?.length || 0} campaigns)`,
                results: { emails: emailResult, leads: leadResult }
            };
        }

        return { error: 'Invalid job name' };
    } catch (error: any) {
        console.error("Failed to run manual cron:", error);
        return { error: error.message || "Failed to run cron job." };
    }
}

// Campaign Actions
export async function createCampaign(formData: FormData) {
    const leadIdsRaw = formData.get("leadIds")?.toString();

    const rawData = {
        name: formData.get("name")?.toString(),
        templateId: formData.get("templateId")?.toString(),
        leadIds: leadIdsRaw ? JSON.parse(leadIdsRaw) : [],
    };

    const result = CampaignSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation error:", result.error.flatten());
        return { error: "Validation failed" };
    }

    try {
        // Check SMTP exists
        const smtp = await prisma.smtpConfig.findFirst();
        if (!smtp) {
            return { error: "Please configure SMTP settings first" };
        }

        // Check for duplicate emails
        const leads = await prisma.lead.findMany({
            where: { id: { in: result.data.leadIds } },
        });

        const uniqueEmails = new Set(leads.map((l: { email: string }) => l.email));
        if (uniqueEmails.size !== leads.length) {
            return { error: "Duplicate emails detected in selected leads" };
        }

        // Create campaign with default schedule config
        const campaign = await prisma.campaign.create({
            data: {
                name: result.data.name,
                templateId: result.data.templateId,
                scheduleConfig: JSON.stringify({
                    delayMin: 120, // 2 minutes
                    delayMax: 600, // 10 minutes
                    dailyLimit: 50,
                }),
                leads: {
                    create: result.data.leadIds.map(id => ({
                        leadId: id,
                        status: "QUEUED",
                    })),
                },
            },
        });

        revalidatePath("/campaigns");
        return { success: true, id: campaign.id };
    } catch (error) {
        console.error("Failed to create campaign:", error);
        return { error: "Failed to create campaign." };
    }
}

export async function updateCampaignStatus(campaignId: string, status: string) {
    // Validate status enum to prevent invalid values
    if (!validateCampaignStatus(status)) {
        return {
            error: `Invalid campaign status. Must be one of: ${VALID_CAMPAIGN_STATUSES.join(', ')}`
        };
    }

    try {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status,
                startedAt: status === "ACTIVE" ? new Date() : undefined,
            },
        });

        revalidatePath(`/campaigns/${campaignId}`);
        revalidatePath("/campaigns");
        return { success: true };
    } catch (error) {
        console.error("Failed to update campaign status:", error);
        return { error: "Failed to update campaign status." };
    }
}

export async function deleteCampaign(campaignId: string) {
    try {
        await prisma.campaign.delete({
            where: { id: campaignId },
        });

        revalidatePath("/campaigns");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete campaign:", error);
        return { error: "Failed to delete campaign." };
    }
}

export async function getCampaignProgress(campaignId: string) {
    const leads = await prisma.campaignLead.findMany({
        where: { campaignId },
        select: { status: true },
    });

    const stats = {
        total: leads.length,
        queued: leads.filter((l: { status: string }) => l.status === "QUEUED").length,
        sent: leads.filter((l: { status: string }) => l.status === "SENT").length,
        failed: leads.filter((l: { status: string }) => l.status === "FAILED").length,
    };

    return stats;
}

export async function sendOneOffEmail(leadId: string, subject: string, body: string) {
    try {
        const config = await prisma.smtpConfig.findFirst();
        if (!config) {
            return { error: "SMTP not configured" };
        }

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            return { error: "Lead not found" };
        }

        // Import dynamically to avoid circular deps if any
        const { sendEmail } = await import("@/lib/email");

        await sendEmail(config as any, { subject, body }, lead);

        await prisma.lead.update({
            where: { id: leadId },
            data: { status: LeadStatus.CONTACTED }
        });

        revalidatePath("/leads");
        revalidatePath(`/outreach/${leadId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { error: "Failed to send email. Check server logs." };
    }
}
