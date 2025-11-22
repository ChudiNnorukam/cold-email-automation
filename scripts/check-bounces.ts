import imaps from 'imap-simple';
import { PrismaClient, LeadStatus } from '@prisma/client';
import prisma from '../lib/prisma';

async function checkBounces() {
    console.log("Checking for bounced emails...");

    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("SMTP Config not found!");
        return;
    }

    const config = {
        imap: {
            user: smtpConfig.user,
            password: smtpConfig.password,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 3000
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Search for emails from mailer-daemon (typical for bounces)
        // and unread (SEEN: false) to avoid re-processing? 
        // For now, let's just look for "mailer-daemon" in the last 24 hours.
        const delay = 24 * 3600 * 1000;
        const yesterday = new Date();
        yesterday.setTime(Date.now() - delay);

        const searchCriteria = [
            ['SINCE', yesterday.toISOString()],
            ['FROM', 'mailer-daemon']
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} potential bounce messages.`);

        for (const message of messages) {
            const all = message.parts.find(part => part.which === 'TEXT');
            const id = message.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";

            const parsed = await simpleParser(idHeader + all?.body);
            const body = parsed.text || "";

            // Extract email address from body
            // Typical bounce: "The email account that you tried to reach does not exist"
            // "550 5.1.1 <failed@example.com>..."
            const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g;
            const emails = body.match(emailRegex);

            if (emails) {
                for (const email of emails) {
                    // Check if this email exists in our DB
                    const lead = await prisma.lead.findFirst({ where: { email } });
                    if (lead && lead.status !== 'BOUNCED') {
                        console.log(`❌ Detected bounce for: ${email}`);

                        // Update Lead Status
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: { status: LeadStatus.BOUNCED }
                        });

                        // Update CampaignLead Status
                        await prisma.campaignLead.updateMany({
                            where: { leadId: lead.id },
                            data: { status: LeadStatus.BOUNCED }
                        });
                    }
                }
            }
        }

        connection.end();
        console.log("Bounce check complete.");

    } catch (error: any) {
        console.error("Error checking bounces:", error.message);
    }
}

checkBounces();
