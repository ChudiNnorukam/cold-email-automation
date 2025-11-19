import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const DAILY_LIMIT = 15;
const MIN_DELAY_MS = 2000; // 2 seconds
const MAX_DELAY_MS = 5000; // 5 seconds

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('Starting daily sender...');

    // 1. Check Daily Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await prisma.campaignLead.count({
        where: {
            status: "SENT",
            sentAt: { gte: today }
        }
    });

    console.log(`Emails sent today: ${sentToday}/${DAILY_LIMIT}`);

    if (sentToday >= DAILY_LIMIT) {
        console.log("Daily limit reached. Stopping.");
        return;
    }

    const remainingQuota = DAILY_LIMIT - sentToday;

    // 2. Fetch Queued Leads
    // We prioritize "No Website Outreach" but could fetch from any active campaign
    const campaign = await prisma.campaign.findFirst({
        where: { name: "No Website Outreach" },
        include: {
            leads: {
                where: { status: "QUEUED" },
                take: remainingQuota,
                include: { lead: true }
            }
        }
    });

    if (!campaign || campaign.leads.length === 0) {
        console.log("No queued leads found.");
        return;
    }

    // 3. Get Template & Config
    const template = await prisma.template.findUnique({ where: { id: campaign.templateId } });
    const smtpConfig = await prisma.smtpConfig.findFirst();

    if (!template || !smtpConfig) {
        console.error("Missing template or SMTP config.");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure,
        auth: { user: smtpConfig.user, pass: smtpConfig.password },
    } as any);

    // 4. Send Loop
    for (const campaignLead of campaign.leads) {
        const lead = campaignLead.lead;
        console.log(`Processing: ${lead.email}`);

        // Render
        let safeName = lead.name;
        if (!safeName || safeName.toLowerCase().includes('unknown')) safeName = "there";
        let safeCompany = lead.company.split('.')[0];
        safeCompany = safeCompany.charAt(0).toUpperCase() + safeCompany.slice(1);

        const subject = template.subject.replace('{{Company}}', safeCompany);
        const body = template.body
            .replace('{{Name}}', safeName)
            .replace('{{Company}}', safeCompany)
            .replace('[City]', 'your area');

        try {
            await transporter.sendMail({
                from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                to: lead.email,
                subject: subject,
                text: body,
            });

            await prisma.campaignLead.update({
                where: { id: campaignLead.id },
                data: { status: "SENT", sentAt: new Date() }
            });

            console.log(`Sent to ${lead.email}`);

        } catch (error) {
            console.error(`Failed to send to ${lead.email}:`, error);
            await prisma.campaignLead.update({
                where: { id: campaignLead.id },
                data: { status: "FAILED", errorMessage: String(error) }
            });
        }

        // Random Delay
        const delay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1) + MIN_DELAY_MS);
        console.log(`Waiting ${delay}ms...`);
        await sleep(delay);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
