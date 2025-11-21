import prisma from '../lib/prisma';

async function auditQueuedEmails() {
    console.log('🔍 Starting audit of queued emails...');

    // 1. Fetch all queued campaign leads
    const queuedLeads = await prisma.campaignLead.findMany({
        where: {
            status: 'QUEUED',
        },
        include: {
            lead: true,
            campaign: true,
        },
        orderBy: {
            scheduledFor: 'asc',
        },
    });

    console.log(`\n📊 Total Queued Emails: ${queuedLeads.length}`);

    if (queuedLeads.length === 0) {
        console.log('✅ No emails are currently queued.');
        return;
    }

    // 2. Analyze for duplicates
    const emailMap = new Map<string, typeof queuedLeads>();

    for (const item of queuedLeads) {
        const email = item.lead.email;
        if (!emailMap.has(email)) {
            emailMap.set(email, []);
        }
        emailMap.get(email)?.push(item);
    }

    const duplicates: { email: string; count: number; campaigns: string[] }[] = [];

    for (const [email, items] of emailMap.entries()) {
        if (items.length > 1) {
            duplicates.push({
                email,
                count: items.length,
                campaigns: items.map((i) => `${i.campaign.name} (ID: ${i.campaign.id})`),
            });
        }
    }

    // 3. Report Findings
    console.log(`\n📧 Unique Recipients: ${emailMap.size}`);

    if (duplicates.length > 0) {
        console.log(`\n⚠️  DUPLICATES DETECTED: ${duplicates.length} email(s) scheduled multiple times.`);

        duplicates.forEach((dup, index) => {
            console.log(`\n   ${index + 1}. ${dup.email} is queued ${dup.count} times:`);
            dup.campaigns.forEach((camp) => console.log(`      - ${camp}`));
        });
    } else {
        console.log('\n✅ No duplicate emails detected in the queue.');
    }

    // 4. List next 10 scheduled emails
    console.log('\n📅 Next 10 Scheduled Emails:');
    queuedLeads.slice(0, 10).forEach((item, index) => {
        const date = item.scheduledFor ? item.scheduledFor.toISOString() : 'Not scheduled';
        console.log(`   ${index + 1}. ${item.lead.email} | Campaign: ${item.campaign.name} | Scheduled: ${date}`);
    });
}

auditQueuedEmails()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
