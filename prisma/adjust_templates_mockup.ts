import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adjusting templates for Screenshot/Mockup strategy...');

    const footer = `
Best,
Chudi Nnorukam
Portfolio: https://chudi-nnorukam-portfolio.vercel.app/
LinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/`;

    // 1. The "Digital Ghost" -> Offer a Homepage Concept Screenshot
    await prisma.template.updateMany({
        where: { name: "No Website - The 'Digital Ghost'" },
        data: {
            body: `Hi {{Name}},

I tried to find {{Company}} online today but couldn't find a website.

Most people in [City] check Google Maps before visiting a business. If you aren't there, they go to competitors.

I build simple, high-ranking websites for local businesses. I put together a quick concept of what your homepage could look like.

Mind if I send a screenshot of it over? (No cost).
${footer}`
        }
    });

    // 2. The "Thumb Test" -> Offer a Mobile Fix Screenshot
    await prisma.template.updateMany({
        where: { name: "Bad Mobile Site - The 'Thumb Test'" },
        data: {
            body: `Hi {{Name}},

I was looking at your website on my iPhone and noticed the text is really small—I had to zoom in to read it.

Google actually penalizes sites for this, which hurts your local ranking.

I specialize in fixing this for local businesses. I mocked up a "mobile-friendly" version of your main page to show the difference.

Mind if I send the screenshot over?
${footer}`
        }
    });

    // 3. The "Not Secure" -> Offer a Security Report Screenshot
    await prisma.template.updateMany({
        where: { name: "Insecure Site - The 'Not Secure' Warning" },
        data: {
            body: `Hi {{Name}},

Your website is currently showing a "Not Secure" warning to visitors.

This scares off customers and hurts your Google ranking. The good news? It's usually a quick fix.

I ran a quick check and found the exact issue.

Do you want me to send a screenshot of the report and how we can fix it?
${footer}`
        }
    });

    console.log("Templates adjusted for Screenshot/Mockup strategy.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
