import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProgress() {
    const campaign = await prisma.campaign.findFirst({
        where: { name: "Modern Redesign Campaign" }
    });

    if (!campaign) {
        console.log("❌ Campaign not found.");
        return;
    }

    const stats = await prisma.campaignLead.groupBy({
        by: ['status'],
        where: {
            campaignId: campaign.id,
            lead: {
                email: { not: { contains: '@placeholder.com' } }
            }
        },
        _count: { status: true }
    });

    console.log("\n📊 --- BLAST PROGRESS ---");
    let total = 0;
    let sent = 0;
    let queued = 0;
    let failed = 0;

    stats.forEach(s => {
        total += s._count.status;
        if (s.status === 'SENT') sent = s._count.status;
        if (s.status === 'QUEUED') queued = s._count.status;
        if (s.status === 'FAILED') failed = s._count.status;
    });

    const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

    // Create a progress bar
    const barLength = 20;
    const filledLength = Math.round((barLength * percent) / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    console.log(`Progress: [${bar}] ${percent}%`);
    console.log(`✅ Sent:   ${sent}`);
    console.log(`⏳ Queued: ${queued}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total:    ${total}`);
    console.log("-----------------------");
}

checkProgress()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
