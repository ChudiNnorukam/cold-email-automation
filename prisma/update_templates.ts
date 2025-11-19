import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating templates to include LinkedIn and Portfolio...');

    const footer = `
Best,
Chudi Nnorukam
Portfolio: https://chudi-nnorukam-portfolio.vercel.app/
LinkedIn: https://www.linkedin.com/in/chudi-nnorukam-b91203143/`;

    // Update "Bad Mobile Site"
    const mobileTemplate = await prisma.template.findFirst({
        where: { name: "Bad Mobile Site - The 'Thumb Test'" }
    });

    if (mobileTemplate) {
        await prisma.template.update({
            where: { id: mobileTemplate.id },
            data: {
                body: `Hi {{Name}},

I'm a local customer and I noticed something while looking at your website on my phone.

The text is really small and hard to read without zooming in. Google actually penalizes websites for this, pushing them down in search results so fewer people find you.

I can fix this for you. I specialize in "Responsive Redesigns" - making your site look perfect on every device (iPhone, Android, Laptop).

I've recently updated my portfolio here: https://chudi-nnorukam-portfolio.vercel.app/

Would you be open to a free 15-minute audit where I show you exactly what needs fixing?
${footer}`
            }
        });
        console.log("Updated 'Bad Mobile Site' template.");
    }

    // Update "Insecure Site"
    const secureTemplate = await prisma.template.findFirst({
        where: { name: "Insecure Site - The 'Not Secure' Warning" }
    });

    if (secureTemplate) {
        await prisma.template.update({
            where: { id: secureTemplate.id },
            data: {
                body: `Hi {{Name}},

I noticed your website {{Company}} is showing a "Not Secure" warning in the browser bar.

This happens when a site lacks an SSL certificate. It scares off customers because they worry their data isn't safe, and Google warns them not to visit.

I can fix this for you in about 24 hours.

I'm a freelance developer helping local businesses secure their online presence. You can check my work here: https://chudi-nnorukam-portfolio.vercel.app/

Can I send you a quick quote to get this fixed?
${footer}`
            }
        });
        console.log("Updated 'Insecure Site' template.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
