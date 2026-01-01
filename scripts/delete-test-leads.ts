
import prisma from '../lib/prisma';

async function main() {
    console.log("🗑️  Deleting test leads...");

    // 1. Delete leads with "qualified.lead" in email
    const { count: count1 } = await prisma.lead.deleteMany({
        where: {
            email: { contains: 'qualified.lead', mode: 'insensitive' }
        }
    });

    // 2. Delete leads with "MockFinder" source (if we tracked source in notes or similar, but we don't have a source field on Lead model yet, only in LeadResultSchema)
    // The seed script used specific patterns.

    // Let's also delete leads that match the seed pattern exactly if any remain
    const { count: count2 } = await prisma.lead.deleteMany({
        where: {
            company: { startsWith: 'Qualified Co' }
        }
    });

    console.log(`✅ Deleted ${count1} leads matching 'qualified.lead' email.`);
    console.log(`✅ Deleted ${count2} leads matching 'Qualified Co' company.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
