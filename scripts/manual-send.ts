import prisma from '../lib/prisma';
import { sendEmail } from '../lib/email';

async function sendManualEmails() {
    console.log("Starting manual email sender...");

    // 1. Get SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        console.error("SMTP Config not found!");
        return;
    }

    // 2. Get QUEUED leads for 'No Website Outreach'
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
        console.error("Campaign not found!");
        return;
    }

    const leadsToProcess = campaign.leads; // Process all queued leads
    console.log(`Found ${leadsToProcess.length} leads to process.`);

    if (leadsToProcess.length === 0) {
        console.log("No leads to process.");
        return;
    }

    // 3. Get Template
    const template = await prisma.template.findUnique({
        where: { id: campaign.templateId! }
    });

    if (!template) {
        console.error("Template not found!");
        return;
    }

    // 4. Send Loop
    let sentCount = 0;
    for (const item of leadsToProcess) {
        try {
            console.log(`Sending to ${item.lead.email}...`);

            await sendEmail(smtpConfig, template, item.lead);

            // Update Status
            await prisma.campaignLead.update({
                where: { id: item.id },
                data: {
                    status: 'SENT',
                    sentAt: new Date()
                }
            });

            // Update SMTP Usage
            await prisma.smtpConfig.update({
                where: { id: smtpConfig.id },
                data: { sentToday: { increment: 1 } }
            });

            sentCount++;
            console.log(`✅ Sent (${sentCount}/${leadsToProcess.length})`);

            // Delay (30-60s)
            if (sentCount < leadsToProcess.length) {
                const delay = Math.floor(Math.random() * 30000) + 30000;
                console.log(`Waiting ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
            }

        } catch (error: any) {
            console.error(`❌ Failed to send to ${item.lead.email}:`, error.message);
            await prisma.campaignLead.update({
                where: { id: item.id },
                data: { status: 'FAILED', errorMessage: error.message }
            });
        }
    }

    console.log("🎉 Manual sending complete.");
}

sendManualEmails();
