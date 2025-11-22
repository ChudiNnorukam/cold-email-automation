import { PrismaClient, LeadStatus } from '@prisma/client';
import { sendEmail } from '../lib/email';

const prisma = new PrismaClient();

async function sendTestEmail() {
    console.log("📧 Preparing Test Email for 'No Website Campaign'...");

    // 1. Create/Get Template for "No Website" Pitch
    // Pitch: "I couldn't find your website... you're missing customers... I can build one."
    const template = await prisma.template.create({
        data: {
            name: "No Website Pitch Template",
            subject: "I couldn't find {{Company}} online...",
            body: `Hi {{Name}},

I was searching for electricians in your area today and couldn't find a website for {{Company}}.

You're likely losing customers to competitors who show up on Google Maps.

I specialize in building high-ranking websites for local businesses. I recently helped a similar company increase their calls by 30% just by getting online.

I sketched out a quick "mock-up" of what your new site could look like.

Mind if I send that over for you to check out? (No cost).

Best,
Chudi Nnorukam`
        }
    });

    // 2. Create Campaign
    const campaign = await prisma.campaign.create({
        data: {
            name: "No Website Campaign",
            status: "ACTIVE",
            templateId: template.id
        }
    });

    console.log(`✅ Created Campaign: ${campaign.name}`);

    // 3. Create Test Lead (User)
    const testLead = await prisma.lead.create({
        data: {
            name: "Chudi Nnorukam",
            email: "nnorukamchudi@gmail.com",
            company: "Chudi's Test Business",
            status: LeadStatus.NEW,
            notes: "Test Lead for No Website Campaign"
        }
    });

    // 4. Get SMTP Config
    const smtpConfig = await prisma.smtpConfig.findFirst();
    if (!smtpConfig) {
        throw new Error("SMTP Config not found! Please configure SMTP first.");
    }

    // 5. Send Email
    console.log(`🚀 Sending test email to ${testLead.email}...`);
    await sendEmail(smtpConfig, template, testLead);

    console.log("✅ Test Email Sent Successfully!");

    // Cleanup (Optional - maybe keep campaign for future use?)
    // For now, let's keep it so the user can see it in the DB if they check.
}

sendTestEmail()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
