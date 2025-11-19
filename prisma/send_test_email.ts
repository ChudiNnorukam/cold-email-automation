import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    console.log('Preparing to send test email...');

    // 1. Get Campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Outreach" }
    });

    if (!campaign) {
        console.error("Campaign not found.");
        return;
    }

    const template = await prisma.template.findUnique({
        where: { id: campaign.templateId }
    });

    if (!template) {
        console.error("Template not found.");
        return;
    }

    // 2. Get a Lead from the Campaign
    const campaignLead = await prisma.campaignLead.findFirst({
        where: { campaignId: campaign.id },
        include: { lead: true }
    });

    if (!campaignLead) {
        console.error("No leads found in campaign.");
        return;
    }

    const lead = campaignLead.lead;
    // const template = campaign.template; // Already fetched above

    // Logic Improvements
    let safeName = lead.name;
    if (!safeName || safeName.toLowerCase().includes('unknown')) {
        safeName = "there";
    }

    let safeCompany = lead.company;
    // Remove TLDs (simple regex for common ones, or just split by dot if it looks like a domain)
    if (safeCompany.includes('.')) {
        safeCompany = safeCompany.split('.')[0]; // "acheatingandair.net" -> "acheatingandair"
        // Capitalize first letter
        safeCompany = safeCompany.charAt(0).toUpperCase() + safeCompany.slice(1);
    }

    // 3. Render Email
    let subject = template.subject.replace('{{Company}}', safeCompany);
    let body = template.body
        .replace('{{Name}}', safeName)
        .replace('{{Company}}', safeCompany)
        .replace('[City]', 'your area'); // Now fits: "competitors in your area"

    console.log('--- RENDERED EMAIL ---');
    console.log(`To: ${lead.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log('----------------------');

    // 4. Send (if SMTP configured)
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
        console.log(`Attempting to send via ${smtpConfig.host}...`);

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.password,
            },
        } as any);

        try {
            // SAFETY: ALWAYS SEND TO USER FOR TESTING
            const testRecipient = "nnorukamchudi@gmail.com";
            console.log(`\n*** SAFETY OVERRIDE: Sending to ${testRecipient} instead of ${lead.email} ***\n`);

            const info = await transporter.sendMail({
                from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                to: testRecipient,
                subject: subject,
                text: body,
            });
            console.log("Message sent: %s", info.messageId);
            console.log(`Test email sent to ${testRecipient}`);
        } catch (error) {
            console.error("Error sending email:", error);
        }
    } else {
        console.log("No SMTP config found. Skipping actual send.");
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
