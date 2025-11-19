import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding high-conversion templates...');

    const templates = [
        {
            name: "No Website - The 'Digital Ghost'",
            subject: "I couldn't find {{Company}} online",
            body: `Hi {{Name}},

I was trying to look up {{Company}} in [City] today but couldn't find a website for you.

In 2025, 75% of customers check Google before visiting a business. If they can't find you, they often go to a competitor who is visible.

I'm a local web developer specializing in getting businesses online quickly and affordably. I can build you a professional, mobile-friendly website that:
1. Shows up on Google Maps.
2. Builds trust with new customers.
3. Works perfectly on all phones.

I'm currently offering a "Get Online" package for $950 (standard market rate is $2,500+).

Are you open to a 10-minute chat this week to see what a website could look like for {{Company}}?

Best,
Chudi Nnorukam
https://chudi-nnorukam-portfolio.vercel.app/
https://www.linkedin.com/in/chudi-nnorukam-b91203143/`,
            isDefault: true
        },
        {
            name: "Bad Mobile Site - The 'Thumb Test'",
            subject: "Problem with {{Company}} on iPhone",
            body: `Hi {{Name}},

I'm a local customer and I noticed something while looking at your website on my phone.

The text is really small and hard to read without zooming in. Google actually penalizes websites for this, pushing them down in search results so fewer people find you.

I can fix this for you. I specialize in "Responsive Redesigns" - making your site look perfect on every device (iPhone, Android, Laptop).

I've recently updated my portfolio here: https://chudi-nnorukam-portfolio.vercel.app/

Would you be open to a free 15-minute audit where I show you exactly what needs fixing?

Best,
Chudi Nnorukam`,
            isDefault: false
        },
        {
            name: "Insecure Site - The 'Not Secure' Warning",
            subject: "Security warning on your website",
            body: `Hi {{Name}},

I noticed your website {{Company}} is showing a "Not Secure" warning in the browser bar.

This happens when a site lacks an SSL certificate. It scares off customers because they worry their data isn't safe, and Google warns them not to visit.

I can fix this for you in about 24 hours.

I'm a freelance developer helping local businesses secure their online presence. You can check my work here: https://chudi-nnorukam-portfolio.vercel.app/

Can I send you a quick quote to get this fixed?

Best,
Chudi Nnorukam`,
            isDefault: false
        }
    ];

    for (const t of templates) {
        await prisma.template.create({
            data: t
        });
        console.log(`Created template: ${t.name}`);
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
