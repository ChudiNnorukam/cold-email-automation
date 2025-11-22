import prisma from '../lib/prisma';

async function updateTemplate() {
    console.log("Updating 'No Website - The 'Digital Ghost'' to Optimized Version...");

    const template = await prisma.template.findFirst({
        where: { name: "No Website - The 'Digital Ghost'" }
    });

    if (!template) {
        console.error("Template not found!");
        return;
    }

    const newBody = "Hi {{Name}},\n\nI was searching for electricians in your area today and couldn't find a website for {{Company}}.\n\nYou're likely losing customers to competitors who show up on Google Maps.\n\nI specialize in building high-ranking websites for local businesses. I recently helped a similar company increase their calls by 30% just by getting online.\n\nI sketched out a quick \"mock-up\" of what your new site could look like.\n\nMind if I send that over for you to check out? (No cost).\n\nBest,\nChudi Nnorukam\nPortfolio: https://chudi-nnorukam-portfolio.vercel.app/\nLinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/";
    const newSubject = "Website idea for {{Company}}";

    await prisma.template.update({
        where: { id: template.id },
        data: {
            subject: newSubject,
            body: newBody
        }
    });

    console.log("✅ Template updated successfully!");
    console.log(`   New Subject: ${newSubject}`);
    console.log(`   New Body Preview: ${newBody.substring(0, 100)}...`);
}

updateTemplate();
