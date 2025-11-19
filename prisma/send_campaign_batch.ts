import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    console.log('Sending campaign batch (Safety Mode: Redirecting to user)...');

    // 1. Get Campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" },
        include: {
            leads: {
                where: { status: "QUEUED" },
                include: { lead: true }
            }
        }
    });

    if (!campaign) {
        console.error("Campaign not found.");
        return;
    }

    // Get Template
    const template = await prisma.template.findUnique({
        where: { id: campaign.templateId }
    });

    if (!template) {
        console.error("Template not found.");
        return;
    }

    // SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("No SMTP config found.");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
        },
    } as any);

    // const TEST_RECIPIENT = "nnorukamchudi@gmail.com"; // Safety removed

    for (const campaignLead of campaign.leads) {
        const lead = campaignLead.lead;
        console.log(`\nProcessing lead: ${lead.company} (${lead.email})`);

        // Render
        let safeName = lead.name;
        if (!safeName || safeName.toLowerCase().includes('unknown')) safeName = "there";

        let safeCompany = lead.company;
        if (safeCompany.includes('.')) {
            safeCompany = safeCompany.split('.')[0];
            safeCompany = safeCompany.charAt(0).toUpperCase() + safeCompany.slice(1);
        }

        let subject = template.subject.replace('{{Company}}', safeCompany);
        let body = template.body
            .replace('{{Name}}', safeName)
            .replace('{{Company}}', safeCompany)
            .replace('[City]', 'your area');

        // Send
        try {
            console.log(`Sending to ${lead.email}...`);

            await transporter.sendMail({
                from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                to: lead.email, // ACTUAL RECIPIENT
                subject: subject,
                text: body,
            });

            // Update Status
            await prisma.campaignLead.update({
                where: { id: campaignLead.id },
                data: {
                    status: "SENT",
                    sentAt: new Date()
                }
            });

            console.log("Sent and status updated.");

        } catch (error) {
            console.error("Failed to send:", error);
            await prisma.campaignLead.update({
                where: { id: campaignLead.id },
                data: {
                    status: "FAILED",
                    errorMessage: String(error)
                }
            });
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
