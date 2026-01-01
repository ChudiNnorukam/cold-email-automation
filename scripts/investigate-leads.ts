
import prisma from '../lib/prisma';

async function main() {
    console.log("🔍 Searching for leads matching 'qualified.l.'...");

    // Check for leads with email or name containing "qualified"
    const leads = await prisma.lead.findMany({
        where: {
            OR: [
                { email: { contains: 'qualified', mode: 'insensitive' } },
                { name: { contains: 'qualified', mode: 'insensitive' } },
                { company: { contains: 'qualified', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Found ${leads.length} leads.`);
    leads.forEach(lead => {
        console.log(JSON.stringify(lead, null, 2));
    });

    // Also check if it's a specific email domain
    const leadsByDomain = await prisma.lead.findMany({
        where: {
            email: { endsWith: '@qualified.l.' }
        }
    });
    console.log(`Found ${leadsByDomain.length} leads with domain '@qualified.l.'.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
