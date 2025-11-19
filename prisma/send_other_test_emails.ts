import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    console.log('Preparing to send test emails for other templates...');

    const templatesToTest = [
        "No Website - The 'Digital Ghost'",
        "Bad Mobile Site - The 'Thumb Test'"
    ];

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

    for (const templateName of templatesToTest) {
        const template = await prisma.template.findFirst({
            where: { name: templateName }
        });

        if (!template) {
            console.log(`Template '${templateName}' not found.`);
            continue;
        }

        // Dummy data for testing
        const dummyLead = {
            name: "John Doe",
            company: "Acme Corp",
            email: "nnorukamchudi@gmail.com" // Target for test
        };

        let subject = template.subject.replace('{{Company}}', dummyLead.company);
        let body = template.body
            .replace('{{Name}}', dummyLead.name)
            .replace('{{Company}}', dummyLead.company)
            .replace('[City]', 'your area'); // Fallback if still present

        console.log(`\nSending test for: ${templateName}`);
        console.log(`Subject: ${subject}`);

        try {
            await transporter.sendMail({
                from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                to: dummyLead.email,
                subject: `[TEST] ${subject}`,
                text: body,
            });
            console.log(`Email sent to ${dummyLead.email}`);
        } catch (error) {
            console.error(`Error sending email for ${templateName}:`, error);
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
