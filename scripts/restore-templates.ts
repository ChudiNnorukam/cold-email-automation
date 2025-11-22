import prisma from '../lib/prisma';

const templates = [
    {
        name: "No Website - The 'Digital Ghost'",
        subject: "Question about {{Company}}",
        body: "Hi {{Name}},\n\nI tried to find {{Company}} online today but couldn't find a website.\n\nMost people in your area check Google Maps before visiting a business. If you aren't there, they go to competitors.\n\nI build simple, high-ranking websites for local businesses. I'd love to build a quick \"mock-up\" for you to show you how it could look.\n\nMind if I send that over for you to check out? (No cost).\n\nBest,\nChudi Nnorukam\nPortfolio: https://chudi-nnorukam-portfolio.vercel.app/\nLinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/",
        isDefault: true
    },
    {
        name: "Bad Mobile Site - The 'Thumb Test'",
        subject: "Trying to view {{Company}} on my phone",
        body: "Hi {{Name}},\n\nI was looking at your website on my iPhone and noticed the text is really small—I had to zoom in to read it.\n\nGoogle actually penalizes sites for this, which hurts your local ranking.\n\nI specialize in fixing this for local businesses. I created a quick mockup screenshot showing exactly what needs to be tweaked.\n\nMind if I send it over?\n\nBest,\nChudi Nnorukam\nPortfolio: https://chudi-nnorukam-portfolio.vercel.app/\nLinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/",
        isDefault: false
    },
    {
        name: "Insecure Site - The 'Not Secure' Warning",
        subject: "Security alert on {{Company}} website",
        body: "Hi {{Name}},\n\nYour website is currently showing a \"Not Secure\" warning to visitors.\n\nThis scares off customers and hurts your Google ranking. The good news? It's usually a quick fix.\n\nI help local businesses secure their sites. I can get this fixed for you by tomorrow.\n\nDo you want me to send over the details on how we can fix it?\n\nBest,\nChudi Nnorukam\nPortfolio: https://chudi-nnorukam-portfolio.vercel.app/\nLinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/",
        isDefault: false
    },
    {
        name: "Modern Redesign - The 'Fresh Look'",
        subject: "Idea for {{Company}} website",
        body: "Hi {{Name}},\n\nI was checking out {{Company}} online and saw you have a website up and running. Great start.\n\nI noticed a few areas where we could really modernize the look to help you stand out from competitors in your area.\n\nI specialize in building high-converting, modern websites. I put together a quick \"concept\" of a refreshed homepage for you.\n\nMind if I send the screenshot over? (No cost).\n\nBest,\nChudi Nnorukam\nPortfolio: https://chudi-nnorukam-portfolio.vercel.app/\nLinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/",
        isDefault: false
    }
];

async function restoreTemplates() {
    console.log("Restoring templates to Production DB...");

    for (const t of templates) {
        const existing = await prisma.template.findFirst({ where: { name: t.name } });
        if (!existing) {
            await prisma.template.create({ data: t });
            console.log(`✅ Restored: ${t.name}`);
        } else {
            console.log(`⚠️ Skipped (Exists): ${t.name}`);
        }
    }

    // Update Campaign to use the correct template
    const campaign = await prisma.campaign.findFirst({ where: { name: "No Website Outreach" } });
    const correctTemplate = await prisma.template.findFirst({ where: { name: "No Website - The 'Digital Ghost'" } });

    if (campaign && correctTemplate) {
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { templateId: correctTemplate.id }
        });
        console.log(`✅ Updated Campaign '${campaign.name}' to use template: '${correctTemplate.name}'`);
    }
}

restoreTemplates();
