import prisma from '../lib/prisma';

async function verifySequenceLogic() {
    console.log('🧪 Verifying Sequence Logic...');

    // 1. Setup Test Data
    const lead = await prisma.lead.create({
        data: {
            name: "Sequence Test",
            email: "test-sequence@example.com",
            company: "Test Corp",
            status: "NEW"
        }
    });

    const sequence = await prisma.sequence.findFirst({ where: { name: "1-2-3 Touch Strategy" } });
    if (!sequence) throw new Error("Sequence not found");

    const campaign = await prisma.campaign.create({
        data: {
            name: "Test Sequence Campaign",
            sequenceId: sequence.id,
            status: "ACTIVE"
        }
    });

    const campaignLead = await prisma.campaignLead.create({
        data: {
            campaignId: campaign.id,
            leadId: lead.id,
            status: "QUEUED",
            currentStep: 1
        }
    });

    console.log(`   ✅ Created Test Lead (ID: ${lead.id}) in Campaign`);

    // 2. Simulate Step 1 (Should be picked up)
    console.log('\n--- Simulation: Step 1 ---');
    // In a real test we'd call the API, but here we'll query what the API *would* find
    const step1Candidates = await prisma.campaignLead.findMany({
        where: {
            campaignId: campaign.id,
            status: 'QUEUED',
            lead: { status: { not: 'REPLIED' } }
        }
    });

    if (step1Candidates.length > 0) {
        console.log(`   ✅ Step 1 Candidate Found: ${step1Candidates[0].leadId}`);

        // Manually advance state to simulate sending
        await prisma.campaignLead.update({
            where: { id: campaignLead.id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                currentStep: 2,
                nextStepAt: new Date(Date.now() - 10000) // Simulate "Ready for Step 2" (past date)
            }
        });
        console.log('   ✅ Simulated Sending Step 1 -> Moved to Step 2 (Ready)');
    } else {
        console.error('   ❌ Step 1 Candidate NOT Found');
    }

    // 3. Simulate Step 2 (Should be picked up because nextStepAt is past)
    console.log('\n--- Simulation: Step 2 ---');
    const step2Candidates = await prisma.campaignLead.findMany({
        where: {
            campaignId: campaign.id,
            status: 'SENT',
            nextStepAt: { lte: new Date() },
            lead: { status: { not: 'REPLIED' } }
        }
    });

    if (step2Candidates.length > 0) {
        console.log(`   ✅ Step 2 Candidate Found: ${step2Candidates[0].leadId}`);

        // Simulate Reply
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'REPLIED' }
        });
        console.log('   ✅ Simulated User Reply');
    } else {
        console.error('   ❌ Step 2 Candidate NOT Found');
    }

    // 4. Simulate Step 3 (Should be BLOCKED because Replied)
    console.log('\n--- Simulation: Step 3 (After Reply) ---');
    const step3Candidates = await prisma.campaignLead.findMany({
        where: {
            campaignId: campaign.id,
            status: 'SENT',
            nextStepAt: { lte: new Date() },
            lead: { status: { not: 'REPLIED' } } // This should filter it out
        }
    });

    if (step3Candidates.length === 0) {
        console.log('   ✅ Step 3 correctly BLOCKED (User Replied)');
    } else {
        console.error('   ❌ Step 3 was NOT blocked!');
    }

    // Cleanup
    await prisma.campaign.delete({ where: { id: campaign.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    console.log('\n✨ Verification Complete (Cleaned up test data)');
}

verifySequenceLogic()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
