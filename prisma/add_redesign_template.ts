import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding "Modern Redesign" template...');

    const footer = `
Best,
Chudi Nnorukam
Portfolio: https://chudi-nnorukam-portfolio.vercel.app/
LinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/`;

    await prisma.template.create({
        data: {
            name: "Modern Redesign - The 'Fresh Look'",
            subject: "Idea for {{Company}} website",
            body: `Hi {{Name}},

I was checking out {{Company}} online and saw you have a website up and running. Great start.

I noticed a few areas where we could really modernize the look to help you stand out from competitors in your area.

I specialize in building high-converting, modern websites. I put together a quick "concept" of a refreshed homepage for you.

Mind if I send the screenshot over? (No cost).
${footer}`
        }
    });

    console.log("Added 'Modern Redesign' template.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
