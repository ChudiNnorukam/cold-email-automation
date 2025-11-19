'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/crypto";
import { testConnection } from "@/lib/email";

const LeadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().min(1, "Company is required"),
    notes: z.string().optional(),
});

const TemplateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
});

const SmtpConfigSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    host: z.string().optional(),
    port: z.number().optional(),
    secure: z.boolean().default(true),
    user: z.string().min(1, "User is required"),
    password: z.string().min(1, "Password is required"),
    fromName: z.string().min(1, "From name is required"),
    fromEmail: z.string().email("Invalid email address"),
    dailyLimit: z.number().min(1).default(50),
});

const CampaignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    templateId: z.string().min(1, "Template is required"),
    leadIds: z.array(z.string()).min(1, "At least one lead is required"),
});

export async function createLead(formData: FormData) {
    const rawData = {
        name: formData.get("name")?.toString(),
        email: formData.get("email")?.toString(),
        company: formData.get("company")?.toString(),
        notes: formData.get("notes")?.toString() || undefined,
    };

    const result = LeadSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation error:", result.error.flatten());
        // In a real app, we'd return these errors to the form.
        // For now, we'll throw or return early to prevent bad data.
        return { error: "Validation failed" };
    }

    await prisma.lead.create({
        data: {
            ...result.data,
            status: "NEW",
        },
    });

    revalidatePath("/leads");
    revalidatePath("/");
}

export async function updateLeadStatus(leadId: string, status: string) {
    // Simple validation for status enum could go here
    await prisma.lead.update({
        where: { id: leadId },
        data: { status },
    });
    revalidatePath("/leads");
    revalidatePath(`/outreach/${leadId}`);
}

export async function deleteLead(leadId: string) {
    await prisma.lead.delete({
        where: { id: leadId },
    });
    revalidatePath("/leads");
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

    await prisma.template.create({
        data: result.data,
    });

    revalidatePath("/templates");
    revalidatePath("/");
}

export async function deleteTemplate(templateId: string) {
    await prisma.template.delete({
        where: { id: templateId },
    });
    revalidatePath("/templates");
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

    // Check SMTP exists
    const smtp = await prisma.smtpConfig.findFirst();
    if (!smtp) {
        return { error: "Please configure SMTP settings first" };
    }

    // Check for duplicate emails
    const leads = await prisma.lead.findMany({
        where: { id: { in: result.data.leadIds } },
    });

    const uniqueEmails = new Set(leads.map(l => l.email));
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
}

export async function updateCampaignStatus(campaignId: string, status: string) {
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
}

export async function deleteCampaign(campaignId: string) {
    await prisma.campaign.delete({
        where: { id: campaignId },
    });

    revalidatePath("/campaigns");
    return { success: true };
}

export async function getCampaignProgress(campaignId: string) {
    const leads = await prisma.campaignLead.findMany({
        where: { campaignId },
        select: { status: true },
    });

    const stats = {
        total: leads.length,
        queued: leads.filter(l => l.status === "QUEUED").length,
        sent: leads.filter(l => l.status === "SENT").length,
        failed: leads.filter(l => l.status === "FAILED").length,
    };

    return stats;
}
