import { PrismaClient, LeadStatus } from '@prisma/client';
import { processEmailQueue } from '../lib/cron-services';

const prisma = new PrismaClient();

async function testSequenceLogic() {
    console.log("🧪 Testing Sequence Logic...");

    // 0. Reset SMTP Limit
    await prisma.smtpConfig.updateMany({
        data: { sentToday: 0 }
    });

    // 1. Setup: Create a Campaign with a Sequence
    const sequence = await prisma.sequence.create({
        data: {
            name: "Test Sequence",
            steps: {
                create: [
                    {
                        order: 1,
                        delayDays: 0,
                        template: {
                            create: {
                                name: "Step 1 Template",
                                subject: "Step 1",
                                body: "This is step 1"
                            }
                        }
                    },
                    {
                        order: 2,
                        delayDays: 1, // 1 day delay
                        template: {
                            create: {
                                name: "Step 2 Template",
                                subject: "Step 2",
                                body: "This is step 2"
                            }
                        }
                    }
                ]
            }
        }
    });

    const campaign = await prisma.campaign.create({
        data: {
            name: "Sequence Test Campaign",
            status: "ACTIVE",
            sequenceId: sequence.id
        }
    });

    const lead = await prisma.lead.create({
        data: {
            name: "Test Lead",
            email: "nnorukamchudi@gmail.com", // Valid email
            company: "Test Co",
            status: LeadStatus.NEW
        }
    });

    await prisma.campaignLead.create({
        data: {
            campaignId: campaign.id,
            leadId: lead.id,
            status: "QUEUED",
            currentStep: 1
        }
    });

    console.log("✅ Setup Complete. Lead is QUEUED for Step 1.");

    // 2. Run Cron (Step 1)
    console.log("🔄 Running Cron (Expect Step 1 Sent)...");
    const result1 = await processEmailQueue();
    console.log("Result 1:", result1);

    const leadAfterStep1 = await prisma.campaignLead.findUnique({
        where: { campaignId_leadId: { campaignId: campaign.id, leadId: lead.id } }
    });

    if (leadAfterStep1?.status === 'SENT' && leadAfterStep1.currentStep === 2 && leadAfterStep1.nextStepAt) {
        console.log("✅ Step 1 Sent. Lead moved to Step 2. Next Step At:", leadAfterStep1.nextStepAt);
    } else {
        console.error("❌ Step 1 Failed:", leadAfterStep1);
        return;
    }

    // 3. Run Cron (Step 2 - Should NOT send yet due to delay)
    console.log("🔄 Running Cron (Expect Skip due to delay)...");
    const result2 = await processEmailQueue();
    console.log("Result 2:", result2);

    // 4. Fast Forward Time
    console.log("⏩ Fast Forwarding Time (2 days)...");
    await prisma.campaignLead.update({
        where: { id: leadAfterStep1.id },
        data: { nextStepAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) } // 2 days ago
    });

    // 5. Run Cron (Step 2)
    console.log("🔄 Running Cron (Expect Step 2 Sent)...");
    const result3 = await processEmailQueue();
    console.log("Result 3:", result3);

    const leadAfterStep2 = await prisma.campaignLead.findUnique({
        where: { campaignId_leadId: { campaignId: campaign.id, leadId: lead.id } }
    });

    if (leadAfterStep2?.status === 'SENT' && leadAfterStep2.currentStep === 3 && leadAfterStep2.nextStepAt === null) {
        console.log("✅ Step 2 Sent. Sequence Complete.");
    } else {
        console.error("❌ Step 2 Failed:", leadAfterStep2);
    }

    // Cleanup
    await prisma.campaignLead.deleteMany({ where: { campaignId: campaign.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.campaign.delete({ where: { id: campaign.id } });
    await prisma.sequence.delete({ where: { id: sequence.id } });
    // Note: Templates might remain, but that's fine for test
}

testSequenceLogic()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
