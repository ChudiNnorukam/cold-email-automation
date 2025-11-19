import { PrismaClient } from '@prisma/client';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for bounces...');

    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("No SMTP config found.");
        return;
    }

    const config = {
        imap: {
            user: smtpConfig.user,
            password: smtpConfig.password,
            host: 'imap.gmail.com', // Assuming Gmail based on smtpConfig
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 3000
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Search for bounce messages
        // Common subjects: "Delivery Status Notification (Failure)", "Undeliverable", "Mailer-Daemon"
        const searchCriteria = [
            ['OR',
                ['HEADER', 'SUBJECT', 'Delivery Status Notification (Failure)'],
                ['HEADER', 'SUBJECT', 'Undeliverable']
            ],
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()] // Last 24 hours
        ];

        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} potential bounce messages.`);

        for (const message of messages) {
            if (!message.attributes || !message.attributes.struct) {
                console.log("Skipping message with no struct");
                continue;
            }
            const parts = imaps.getParts(message.attributes.struct);
            const part = parts.find(p => p.which === 'TEXT');

            if (part) {
                // Simple parsing to find the failed email
                // This is tricky as formats vary. We look for email-like strings in the body.
                // A better way is to look for "Final-Recipient: rfc822; email@domain.com" in the message/delivery-status part
                // But for now, let's try a regex on the body snippet we fetched.

                // Note: imap-simple fetches parts. We might need to fetch the full body to parse correctly.
                // For this MVP, we will just log that we found a bounce.
                // To fully implement, we need to parse the MIME structure.

                console.log(`Bounce detected: ${message.parts[0].body.subject}`);

                // TODO: Extract email and update DB
                // const email = extractEmail(body);
                // await prisma.campaignLead.update(...)
            }
        }

        connection.end();

    } catch (error) {
        console.error("Bounce check failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
