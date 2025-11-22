import { PrismaClient, LeadStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Workflow Verification...');

    // 1. Get SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("❌ No SMTP config found.");
        return;
    }
    console.log("✅ SMTP Config found:", smtpConfig.fromEmail);

    // 2. Create Test Data
    const testLead = await prisma.lead.create({
        data: {
            name: "Verification Test",
            email: "test@example.com", // Dummy, will be overridden
            company: "Test Corp",
            status: LeadStatus.NEW
        }
    });

    const testTemplate = await prisma.template.create({
        data: {
            name: "Verification Template",
            subject: "Verification Test: {{Company}}",
            body: "Hello {{Name}}, this is a test email for {{Company}}.",
            isDefault: false
        }
    });

    const testCampaign = await prisma.campaign.create({
        data: {
            name: "Verification Campaign",
            templateId: testTemplate.id,
            status: "ACTIVE",
            leads: {
                create: {
                    leadId: testLead.id,
                    status: "QUEUED"
                }
            }
        },
        include: {
            leads: true
        }
    });

    console.log("✅ Test Data Created:", { campaign: testCampaign.name, lead: testLead.email });

    // 3. Execute Sending Logic (Simulating Cron)
    const transporter = nodemailer.createTransport({
        host: smtpConfig.host!,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
        },
    } as any);

    const campaignLead = testCampaign.leads[0];
    const SAFE_RECIPIENT = "nnorukamchudi@gmail.com"; // User's email

    try {
        console.log(`Attempting to send to SAFE_RECIPIENT: ${SAFE_RECIPIENT}...`);

        await transporter.sendMail({
            from: `"${smtpConfig.fromName}" < ${smtpConfig.fromEmail}> `,
            to: SAFE_RECIPIENT,
            subject: testTemplate.subject.replace('{{Company}}', testLead.company),
            text: testTemplate.body.replace('{{Name}}', testLead.name).replace('{{Company}}', testLead.company),
            headers: {
                'X-Verification-Test': 'true'
            }
        });

        console.log("✅ Email sent successfully!");

        // Update Status
        await prisma.campaignLead.update({
            where: { id: campaignLead.id },
            data: { status: "SENT", sentAt: new Date() }
        });
        console.log("✅ Status updated to SENT.");

    } catch (error) {
        console.error("❌ Failed to send:", error);
    } finally {
        // Cleanup
        console.log("Cleaning up test data...");
        await prisma.campaignLead.deleteMany({ where: { campaignId: testCampaign.id } });
        await prisma.campaign.delete({ where: { id: testCampaign.id } });
        await prisma.template.delete({ where: { id: testTemplate.id } });
        await prisma.lead.delete({ where: { id: testLead.id } });
        console.log("✅ Cleanup complete.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
