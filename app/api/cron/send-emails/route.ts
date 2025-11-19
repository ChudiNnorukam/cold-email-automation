import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const maxDuration = 60; // Try to extend timeout (Hobby limit might be 10s, but worth trying)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await resetDailyLimits();

    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) return NextResponse.json({ message: 'SMTP not configured' });

    if (smtpConfig.sentToday >= smtpConfig.dailyLimit) {
      return NextResponse.json({ message: 'Daily limit reached' });
    }

    // Process campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE', isProcessing: false },
    });

    let processed = 0;
    const results = [];
    const MAX_BATCH_SIZE = 10; // Send up to 10 emails per run (fit in ~10-20s)

    for (const campaign of campaigns) {
      // Lock campaign
      const lock = await prisma.campaign.updateMany({
        where: { id: campaign.id, isProcessing: false },
        data: { isProcessing: true }
      });
      if (lock.count === 0) continue;

      try {
        // Send loop
        while (processed < MAX_BATCH_SIZE) {
          // Check daily limit again
          const currentConfig = await prisma.smtpConfig.findFirst();
          if (!currentConfig || currentConfig.sentToday >= currentConfig.dailyLimit) break;

          const campaignLead = await prisma.campaignLead.findFirst({
            where: { campaignId: campaign.id, status: 'QUEUED' },
            include: { lead: true }
          });

          if (!campaignLead) break; // No more leads in this campaign

          await sendEmailWithRetry(smtpConfig, await prisma.template.findUniqueOrThrow({ where: { id: campaign.templateId } }), campaignLead);

          // Update status
          await prisma.$transaction([
            prisma.campaignLead.update({ where: { id: campaignLead.id }, data: { status: 'SENT', sentAt: new Date() } }),
            prisma.smtpConfig.update({ where: { id: smtpConfig.id }, data: { sentToday: { increment: 1 } } })
          ]);

          processed++;
          results.push({ email: campaignLead.lead.email, status: 'sent' });

          // Small delay to be nice to SMTP server (1s)
          await new Promise(r => setTimeout(r, 1000));
        }
      } finally {
        await prisma.campaign.update({ where: { id: campaign.id }, data: { isProcessing: false } });
      }

      if (processed >= MAX_BATCH_SIZE) break;
    }

    return NextResponse.json({ processed, results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendEmailWithRetry(
  config: any,
  template: any,
  campaignLead: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendEmail(config, template, campaignLead.lead);
      return;
    } catch (error: any) {
      if (i === maxRetries - 1) {
        // Final retry failed
        await prisma.campaignLead.update({
          where: { id: campaignLead.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            retryCount: i + 1,
          },
        });
        throw error;
      }
      // Wait before retry (exponential backoff)
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

async function calculateBounceRate(campaignId: string) {
  const leads = await prisma.campaignLead.findMany({
    where: { campaignId },
    select: { status: true },
  });

  const total = leads.length;
  const failed = leads.filter((l: { status: string }) => l.status === 'FAILED').length;

  return total > 0 ? failed / total : 0;
}
