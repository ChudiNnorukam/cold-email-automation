import prisma from '../lib/prisma';
import { sendEmail } from '../lib/email';

async function sendTestEmail() {
    console.log("Sending test email to nnorukamchudi@gmail.com...");

    // 1. Get SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("SMTP Config not found!");
        return;
    }

    // 2. Get Correct Template
    const template = await prisma.template.findFirst({
        where: { name: "No Website - The 'Digital Ghost'" }
    });

    if (!template) {
        console.error("Template 'No Website - The 'Digital Ghost'' not found!");
        return;
    }

    // 3. Create Mock Lead
    const mockLead = {
        id: "test-lead-id",
        email: "nnorukamchudi@gmail.com",
        name: "Chudi Test",
        company: "Test Company LLC",
        status: "TEST",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // 4. Send Email
    try {
        await sendEmail(smtpConfig, template, mockLead);
        console.log("✅ Test email sent successfully!");
        console.log(`   Subject: ${template.subject.replace('{{Company}}', mockLead.company)}`);
        console.log(`   To: ${mockLead.email}`);
    } catch (error: any) {
        console.error("❌ Failed to send test email:", error.message);
    }
}

sendTestEmail();
