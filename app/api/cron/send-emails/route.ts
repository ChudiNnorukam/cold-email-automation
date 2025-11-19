import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  // Auth is handled by middleware.ts - this endpoint is protected
  try {
    // Reset daily limits if needed
    await resetDailyLimits();

    // Get SMTP config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
      return NextResponse.json({ message: 'SMTP not configured' });
    }

    if (smtpConfig.sentToday >= smtpConfig.dailyLimit) {
      return NextResponse.json({ message: 'Daily limit reached' });
    }

    // Get active campaigns (not locked, not completed)
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE', isProcessing: false },
      take: 5, // Process max 5 campaigns per run
    });

    let processed = 0;
    const results = [];

    for (const campaign of campaigns) {
      // Atomic lock acquisition - prevents race conditions between multiple cron instances
      const lockResult = await prisma.campaign.updateMany({
        where: {
          id: campaign.id,
          isProcessing: false // Only lock if not already processing
        },
        data: { isProcessing: true },
      });

      // If lockResult.count === 0, another instance is processing this campaign
      if (lockResult.count === 0) {
        console.log(`Campaign ${campaign.id} already being processed, skipping`);
        continue;
      }

      try {
        // Get next lead ready to send
        const campaignLead = await prisma.campaignLead.findFirst({
          where: {
            campaignId: campaign.id,
            status: 'QUEUED',
            OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
          },
          include: { lead: true },
        });

        if (!campaignLead) {
          // Campaign complete
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              isProcessing: false,
            },
          });
          results.push({ campaign: campaign.id, status: 'completed' });
          continue;
        }

        // Send email with retry logic
        const template = await prisma.template.findUnique({
          where: { id: campaign.templateId },
        });

        if (!template) {
          throw new Error('Template not found');
        }

        await sendEmailWithRetry(smtpConfig, template, campaignLead);

        // Update status and increment counter in a transaction
        // This ensures consistency - either both succeed or both fail
        await prisma.$transaction([
          prisma.campaignLead.update({
            where: { id: campaignLead.id },
            data: { status: 'SENT', sentAt: new Date() },
          }),
          prisma.smtpConfig.update({
            where: { id: smtpConfig.id },
            data: { sentToday: { increment: 1 } },
          }),
        ]);

        processed++;

        // Schedule next lead
        const scheduleConfig = campaign.scheduleConfig
          ? JSON.parse(campaign.scheduleConfig)
          : { delayMin: 120, delayMax: 600 };

        const delay =
          Math.random() * (scheduleConfig.delayMax - scheduleConfig.delayMin) +
          scheduleConfig.delayMin;
        const nextScheduled = new Date(Date.now() + delay * 1000);

        await prisma.campaignLead.updateMany({
          where: {
            campaignId: campaign.id,
            status: 'QUEUED',
            scheduledFor: null,
          },
          data: { scheduledFor: nextScheduled },
        });

        results.push({ campaign: campaign.id, status: 'sent', leadEmail: campaignLead.lead.email });

        // Check bounce rate
        const bounceRate = await calculateBounceRate(campaign.id);
        if (bounceRate > 0.03) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'PAUSED' },
          });
          results.push({ campaign: campaign.id, status: 'paused_high_bounce_rate', bounceRate });
        }
      } catch (error: any) {
        results.push({
          campaign: campaign.id,
          status: 'error',
          error: error.message,
        });
      } finally {
        // Unlock campaign
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { isProcessing: false, lastProcessedAt: new Date() },
        });
      }

      // Stop if daily limit reached
      const updatedConfig = await prisma.smtpConfig.findFirst();
      if (updatedConfig && updatedConfig.sentToday >= updatedConfig.dailyLimit) {
        break;
      }
    }

    return NextResponse.json({
      processed,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
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
  const failed = leads.filter((l) => l.status === 'FAILED').length;

  return total > 0 ? failed / total : 0;
}
