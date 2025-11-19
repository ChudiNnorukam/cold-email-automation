import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Generating email previews for 5 leads...\n');

    const targetEmails = [
        "austinsgreatestplumbing@gmail.com",
        "austinsplumbers@gmail.com",
        "Theplumberaustintx@gmail.com",
        "calixtoplumbingatx@gmail.com",
        "teamfloright@gmail.com"
    ];

    const leads = await prisma.lead.findMany({
        where: { email: { in: targetEmails } }
    });
    console.log(`Found ${leads.length} leads.`);

    // Fetch templates
    const modernRedesign = await prisma.template.findFirst({ where: { name: { contains: "Modern Redesign" } } });
    const noWebsite = await prisma.template.findFirst({ where: { name: { contains: "No Website" } } });
    const badMobile = await prisma.template.findFirst({ where: { name: { contains: "Bad Mobile" } } });

    console.log(`Templates found: Modern=${!!modernRedesign}, NoWebsite=${!!noWebsite}, BadMobile=${!!badMobile}`);

    if (!modernRedesign || !noWebsite || !badMobile) {
        console.error("Could not find all required templates.");
        return;
    }

    for (const lead of leads) {
        let template = noWebsite; // Force "No Website" for this batch as requested

        // Logic Improvements
        let safeName = lead.name;
        if (!safeName || safeName.toLowerCase().includes('unknown')) {
            safeName = "there";
        }

        let safeCompany = lead.company;
        if (safeCompany.includes('.')) {
            safeCompany = safeCompany.split('.')[0];
            safeCompany = safeCompany.charAt(0).toUpperCase() + safeCompany.slice(1);
        }

        let subject = template.subject.replace('{{Company}}', safeCompany);
        let body = template.body
            .replace('{{Name}}', safeName)
            .replace('{{Company}}', safeCompany)
            .replace('[City]', 'your area');

        console.log(`--- Lead: ${lead.company} (${lead.email || "NO EMAIL"}) ---`);
        console.log(`Template: ${template.name}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${body}`);
        console.log('------------------------------------------------------------\n');
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
