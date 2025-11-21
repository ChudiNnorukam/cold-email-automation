import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await resetDailyLimits();

    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) return NextResponse.json({ message: 'SMTP not configured' });

    if (smtpConfig.isSystemPaused) {
      return NextResponse.json({ message: 'System is paused by Kill Switch' });
    }

    if (smtpConfig.sentToday >= smtpConfig.dailyLimit) {
      return NextResponse.json({ message: 'Daily limit reached' });
    }

    // 1. Find Eligible Leads for Processing
    // - Status is QUEUED (Step 1) OR SENT (Waiting for Step 2+)
    // - nextStepAt is null (Step 1) OR in the past (Step 2+)
    // - Lead has NOT replied
    // - Campaign is ACTIVE
    const eligibleLeads = await prisma.campaignLead.findMany({
      where: {
        campaign: { status: 'ACTIVE' },
        lead: { status: { not: 'REPLIED' } }, // Stop if replied
        OR: [
          { status: 'QUEUED' }, // Ready for Step 1
          {
            status: 'SENT',     // Waiting for next step
            nextStepAt: { lte: new Date() }
          }
        ]
      },
      include: {
        lead: true,
        campaign: {
          include: {
            sequence: {
              include: { steps: true }
            }
          }
        }
      },
      take: 10 // Batch size
    });

    let processed = 0;
    const results = [];

    for (const item of eligibleLeads) {
      // Double check daily limit
      const currentConfig = await prisma.smtpConfig.findFirst();
      if (!currentConfig || currentConfig.sentToday >= currentConfig.dailyLimit) break;

      try {
        // Determine Step
        const sequence = item.campaign.sequence;
        if (!sequence) {
          // Fallback for legacy campaigns (single template)
          if (item.campaign.templateId && item.status === 'QUEUED') {
            const template = await prisma.template.findUnique({ where: { id: item.campaign.templateId } });
            if (template) {
              await sendEmailWithRetry(smtpConfig, template, item);
              await markSent(item.id, smtpConfig.id);
              processed++;
              results.push({ email: item.lead.email, step: 'Legacy', status: 'sent' });
            }
          }
          continue;
        }

        // Sequence Logic
        const currentStepNum = item.currentStep;
        const step = sequence.steps.find(s => s.order === currentStepNum);

        if (!step) {
          // No step found (maybe completed?), mark complete
          await prisma.campaignLead.update({ where: { id: item.id }, data: { status: 'COMPLETED' } });
          continue;
        }

        // Get Template
        const template = await prisma.template.findUnique({ where: { id: step.templateId } });
        if (!template) throw new Error(`Template not found for step ${currentStepNum}`);

        // Send Email
        await sendEmailWithRetry(smtpConfig, template, item);

        // Calculate Next Step
        const nextStepNum = currentStepNum + 1;
        const nextStep = sequence.steps.find(s => s.order === nextStepNum);

        let updateData: any = {
          status: 'SENT',
          sentAt: new Date(),
          currentStep: nextStepNum
        };

        if (nextStep) {
          // Schedule next step
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + nextStep.delayDays);
          updateData.nextStepAt = nextDate;
        } else {
          // Sequence complete
          updateData.status = 'COMPLETED';
          updateData.nextStepAt = null;
        }

        // Update DB
        await prisma.$transaction([
          prisma.campaignLead.update({ where: { id: item.id }, data: updateData }),
          prisma.smtpConfig.update({ where: { id: smtpConfig.id }, data: { sentToday: { increment: 1 } } })
        ]);

        processed++;
        results.push({ email: item.lead.email, step: currentStepNum, status: 'sent' });

        // Rate limit delay
        await new Promise(r => setTimeout(r, 1000));

      } catch (error: any) {
        console.error(`Failed to process lead ${item.lead.email}:`, error);
        await prisma.campaignLead.update({
          where: { id: item.id },
          data: { status: 'FAILED', errorMessage: error.message }
        });
      }
    }

    return NextResponse.json({ processed, results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function markSent(campaignLeadId: string, configId: string) {
  await prisma.$transaction([
    prisma.campaignLead.update({ where: { id: campaignLeadId }, data: { status: 'SENT', sentAt: new Date() } }),
    prisma.smtpConfig.update({ where: { id: configId }, data: { sentToday: { increment: 1 } } })
  ]);
}

async function sendEmailWithRetry(config: any, template: any, campaignLead: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendEmail(config, template, campaignLead.lead);
      return;
    } catch (error: any) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}

async function resetDailyLimits() {
  const today = new Date().toISOString().split('T')[0];
  await prisma.smtpConfig.updateMany({
    where: { lastResetDate: { lt: new Date(today) } },
    data: { sentToday: 0, lastResetDate: new Date() },
  });
}
