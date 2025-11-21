import prisma from '../lib/prisma';

async function checkSystemHealth() {
    console.log('🏥 Running System Health Check...\n');

    // 1. Check SMTP Config
    const smtp = await prisma.smtpConfig.findFirst();
    console.log('📧 SMTP Configuration:');
    if (smtp) {
        console.log(`   ✅ Configured (User: ${smtp.user}, Host: ${smtp.host || 'Gmail/Default'})`);
    } else {
        console.log('   ❌ NOT CONFIGURED - Emails will fail!');
    }

    // 2. Check Campaigns
    const campaigns = await prisma.campaign.findMany({
        include: {
            _count: { select: { leads: true } }
        }
    });
    console.log('\n📢 Campaigns:');
    if (campaigns.length === 0) {
        console.log('   ⚠️  No campaigns found.');
    }
    campaigns.forEach(c => {
        console.log(`   - "${c.name}" | Status: ${c.status} | Total Leads: ${c._count.leads}`);
    });

    // 3. Check Queue Status
    const queued = await prisma.campaignLead.count({ where: { status: 'QUEUED' } });
    const sent = await prisma.campaignLead.count({ where: { status: 'SENT' } });
    const failed = await prisma.campaignLead.count({ where: { status: 'FAILED' } });

    console.log('\n📊 Email Queue Statistics:');
    console.log(`   - 🕒 Queued (Waiting): ${queued}`);
    console.log(`   - ✅ Sent: ${sent}`);
    console.log(`   - ❌ Failed: ${failed}`);

    // 4. Next Scheduled Batch
    if (queued > 0) {
        const nextBatch = await prisma.campaignLead.findMany({
            where: { status: 'QUEUED' },
            take: 5,
            include: { lead: true }
        });
        console.log('\n🔜 Next 5 Emails to Send:');
        nextBatch.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.lead.email} (${item.lead.company})`);
        });
    }

    // 5. Lead Database
    const totalLeads = await prisma.lead.count();
    console.log(`\n👥 Total Leads in Database: ${totalLeads}`);

    console.log('\n✅ Health Check Complete.');
}

checkSystemHealth()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
