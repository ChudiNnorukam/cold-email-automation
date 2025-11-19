import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Refining templates with r/coldemail "Golden Rules"...');

    const footer = `
Best,
Chudi Nnorukam
Portfolio: https://chudi-nnorukam-portfolio.vercel.app/
LinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/`;

    // 1. The "Digital Ghost" -> Refined to "Permission to Pitch"
    // Insight: Don't ask for a call. Ask to send a mock-up/video.
    await prisma.template.updateMany({
        where: { name: "No Website - The 'Digital Ghost'" },
        data: {
            subject: "Question about {{Company}}", // Shorter, curiosity-driven
            body: `Hi {{Name}},

I tried to find {{Company}} online today but couldn't find a website.

Most people in your area check Google Maps before visiting a business. If you aren't there, they go to competitors.

I build simple, high-ranking websites for local businesses. I'd love to build a quick "mock-up" for you to show you how it could look.

Mind if I send that over for you to check out? (No cost).
${footer}`
        }
    });

    // 2. The "Thumb Test" -> Refined to "Value First"
    // Insight: "I'm a customer" angle is strong. Keep it. Soften the CTA.
    await prisma.template.updateMany({
        where: { name: "Bad Mobile Site - The 'Thumb Test'" },
        data: {
            subject: "Trying to view {{Company}} on my phone",
            body: `Hi {{Name}},

I was looking at your website on my iPhone and noticed the text is really small—I had to zoom in to read it.

Google actually penalizes sites for this, which hurts your local ranking.

I specialize in fixing this for local businesses. I created a quick mockup screenshot showing exactly what needs to be tweaked.

Mind if I send it over?
${footer}`
        }
    });

    // 3. The "Not Secure" -> Refined to "Urgency + Help"
    // Insight: Security is a "pain point". Offer the fix directly.
    await prisma.template.updateMany({
        where: { name: "Insecure Site - The 'Not Secure' Warning" },
        data: {
            subject: "Security alert on {{Company}} website",
            body: `Hi {{Name}},

Your website is currently showing a "Not Secure" warning to visitors.

This scares off customers and hurts your Google ranking. The good news? It's usually a quick fix.

I help local businesses secure their sites. I can get this fixed for you by tomorrow.

Do you want me to send over the details on how we can fix it?
${footer}`
        }
    });

    console.log("Templates optimized for high conversion.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
