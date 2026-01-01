import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBlast() {
    console.log("🐞 Debugging Blast...");

    // 1. Check SMTP Config
    const config = await prisma.smtpConfig.findFirst();
    console.log("\n📧 SMTP Config:");
    console.log(config);

    // 2. Check Campaign Leads Status Distribution
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" }
    });

    if (campaign) {
        const stats = await prisma.campaignLead.groupBy({
            by: ['status'],
            where: { campaignId: campaign.id },
            _count: { status: true }
        });
        console.log("\n📊 Lead Statuses:");
        console.log(stats);

        // 3. Check a few 'SKIPPED' or 'FAILED' leads to see error messages
        const problemLeads = await prisma.campaignLead.findMany({
            where: {
                campaignId: campaign.id,
                status: { notIn: ['QUEUED', 'SENT'] }
            },
            take: 5,
            include: { lead: true }
        });

        if (problemLeads.length > 0) {
            console.log("\n⚠️ Problem Leads Sample:");
            problemLeads.forEach(p => {
                console.log(`- ${p.lead.email}: [${p.status}] ${p.errorMessage}`);
            });
        }
    }
}

debugBlast()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
