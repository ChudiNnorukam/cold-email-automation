import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    const templateName = process.argv[2];
    if (!templateName) {
        console.error("Please provide a template name (partial match ok).");
        process.exit(1);
    }

    console.log(`Searching for template matching: "${templateName}"...`);

    const template = await prisma.template.findFirst({
        where: { name: { contains: templateName } }
    });

    if (!template) {
        console.error("Template not found.");
        return;
    }

    console.log(`Found Template: "${template.name}"`);

    // SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("No SMTP config found.");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpConfig.host!,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
        },
    } as any);

    const TEST_LEAD = {
        name: "John Doe",
        company: "Acme Corp",
        email: "nnorukamchudi@gmail.com" // Send to user for preview
    };

    console.log(`Sending preview to ${TEST_LEAD.email}...`);

    const subject = template.subject.replace('{{Company}}', TEST_LEAD.company);
    const body = template.body
        .replace('{{Name}}', TEST_LEAD.name)
        .replace('{{Company}}', TEST_LEAD.company)
        .replace('[City]', 'San Francisco');

    try {
        await transporter.sendMail({
            from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
            to: TEST_LEAD.email,
            subject: `[PREVIEW] ${subject}`,
            text: body,
        });
        console.log("✅ Preview sent successfully!");
    } catch (e) {
        console.error("❌ Failed to send preview:", e);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
