import prisma from '../lib/prisma';

async function seedSequence() {
    console.log('🌱 Seeding "1-2-3 Touch" Sequence...');

    // 1. Create Templates
    const templates = [
        {
            name: "Touch 1: Soft Opener",
            subject: "Quick question about {{Company}}",
            body: `Hi {{Name}},

I noticed [observation] about {{Company}}'s website.

I'm Chudi, a web developer. I recently helped a similar business improve their [metric].

Open to a 5-min chat?

Best,
Chudi`,
            isDefault: true
        },
        {
            name: "Touch 2: Nudge & Value",
            subject: "Re: Quick question about {{Company}}",
            body: `Hi {{Name}},

Just bumping this to the top of your inbox.

Also, thought you might find this relevant: {{MyPortfolio}}

Let me know if you'd like to discuss.

Best,
Chudi`,
            isDefault: true
        },
        {
            name: "Touch 3: Break-up",
            subject: "Last attempt",
            body: `Hi {{Name}},

I assume you're busy or not interested right now, so I won't keep emailing you.

If you ever need help with your website in the future, feel free to reach out.

Here's my portfolio one last time: {{MyPortfolio}}

Best,
Chudi`,
            isDefault: true
        }
    ];

    const createdTemplates = [];
    for (const t of templates) {
        const created = await prisma.template.create({ data: t });
        createdTemplates.push(created);
        console.log(`   ✅ Created Template: ${t.name}`);
    }

    // 2. Create Sequence
    const sequence = await prisma.sequence.create({
        data: {
            name: "1-2-3 Touch Strategy",
            description: "Standard 3-step sequence for cold outreach.",
        }
    });
    console.log(`   ✅ Created Sequence: ${sequence.name}`);

    // 3. Create Steps
    const steps = [
        { order: 1, delayDays: 0, templateId: createdTemplates[0].id },
        { order: 2, delayDays: 3, templateId: createdTemplates[1].id },
        { order: 3, delayDays: 4, templateId: createdTemplates[2].id }, // 4 days after step 2 = Day 7
    ];

    for (const s of steps) {
        await prisma.sequenceStep.create({
            data: {
                sequenceId: sequence.id,
                templateId: s.templateId,
                order: s.order,
                delayDays: s.delayDays,
            }
        });
        console.log(`   ✅ Added Step ${s.order} (Delay: ${s.delayDays} days)`);
    }

    console.log('✨ Sequence Seeding Complete!');
}

seedSequence()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
